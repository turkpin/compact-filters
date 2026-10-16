"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "../icons";
import { cn } from "../cn";
import { formatLabel, getPresetLabel, resolveLabels } from "../labels";
import { Button } from "../primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import {
  ALL_PRESET,
  CUSTOM_PRESET,
  DATE_RANGE_PRESETS,
  addDays,
  addMonths,
  countDays,
  createPresetRange,
  fromIsoDate,
  isIsoDate,
  startOfMonth,
  toIsoDate,
  todayIso,
} from "./date-range";

// 2024-01-01 is a Monday, used to build localized weekday headers.
const WEEK_REFERENCE_MONDAY = "2024-01-01";

function getIntlLocale(locale) {
  return locale === "en" ? "en-US" : "tr-TR";
}

function buildMonthWeeks(month) {
  const first = fromIsoDate(month);
  // Monday-first offset: Mon → 0 … Sun → 6
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(month, index)),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
}

function CalendarMonth({
  month,
  draft,
  hoverDate,
  today,
  isDisabled,
  onSelect,
  onHover,
  formatters,
  header,
}) {
  const weeks = useMemo(() => buildMonthWeeks(month), [month]);
  // While only the start is picked, preview the range up to the hovered day.
  const rangeEnd = draft.to ?? (draft.from && hoverDate && hoverDate > draft.from ? hoverDate : null);

  return (
    <div className="w-full sm:w-64">
      <div className="mb-2 flex h-8 items-center justify-between">
        {header.start ?? <span className="size-7" />}
        <p className="text-sm font-semibold capitalize">{formatters.month.format(fromIsoDate(month))}</p>
        {header.end ?? <span className="size-7" />}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {formatters.weekdays.map((weekday) => (
          <span key={weekday} className="py-1 text-xs font-medium text-muted-foreground">
            {weekday}
          </span>
        ))}
        {weeks.flat().map((day, index) => {
          if (!day) {
            return <span key={`empty-${index}`} className="h-8" />;
          }

          const disabled = isDisabled(day);
          const isStart = day === draft.from;
          const isEnd = day === rangeEnd;
          const inRange = draft.from && rangeEnd && day > draft.from && day < rangeEnd;

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              onMouseEnter={() => onHover(day)}
              aria-pressed={isStart || isEnd}
              aria-label={formatters.full.format(fromIsoDate(day))}
              className={cn(
                "relative flex h-8 cursor-pointer items-center justify-center rounded-md text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                !disabled && !isStart && !isEnd && !inRange && "hover:bg-muted",
                inRange && "bg-primary/15 text-foreground dark:bg-primary/25",
                (isStart || isEnd) && "bg-primary text-primary-foreground hover:bg-primary/90",
                disabled && "cursor-not-allowed text-muted-foreground/40",
              )}
            >
              {Number(day.slice(8))}
              {day === today && (
                <span
                  className={cn(
                    "absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full",
                    isStart || isEnd ? "bg-primary-foreground" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DATE_INPUT_CLASS =
  "h-8 w-36 rounded-md border border-input bg-background px-2.5 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

// Keep the range end visible: in the right-hand month on wide screens, in the only month on narrow ones
function getLeftMonth(to) {
  const twoMonths = typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches;
  return startOfMonth(twoMonths ? addMonths(to, -1) : to);
}

// Intl formatters are costly to create, so each locale builds them once
const formattersCache = new Map();

function getDateRangeFormatters(locale) {
  if (!formattersCache.has(locale)) {
    const intlLocale = getIntlLocale(locale);
    const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: "short" });

    formattersCache.set(locale, {
      short: new Intl.DateTimeFormat(intlLocale, { day: "2-digit", month: "2-digit", year: "numeric" }),
      full: new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
      month: new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }),
      weekdays: Array.from({ length: 7 }, (_, index) =>
        weekday.format(fromIsoDate(addDays(WEEK_REFERENCE_MONDAY, index))),
      ),
    });
  }

  return formattersCache.get(locale);
}

/**
 * @param {string} locale     - "tr" | "en"
 * @param {string|function} dateFormat - How range dates are shown: "locale" (default, "01.10.2026" in tr),
 *                              "iso" ("2026-10-01") or (isoDate) => string
 */
export function useDateRangeFormatters(locale = "tr", dateFormat = "locale") {
  const formatters = getDateRangeFormatters(locale);

  return useMemo(() => {
    if (dateFormat === "iso") return { ...formatters, short: { format: toIsoDate } };
    if (typeof dateFormat === "function") return { ...formatters, short: { format: (date) => dateFormat(toIsoDate(date)) } };
    return formatters;
  }, [formatters, dateFormat]);
}

/**
 * Short label for an applied range: the preset name, or "01.10.2026 – 15.10.2026" for a custom range
 * (dates as `formatters.short` shows them, see useDateRangeFormatters).
 */
export function formatDateRangeLabel(value, labels, formatters) {
  if (!value) return "";

  const preset = DATE_RANGE_PRESETS.find((option) => option.key === value.preset);
  if (preset) return getPresetLabel(labels, preset);

  if (!value.from || !value.to) return "";
  if (value.from === value.to) return formatters.short.format(fromIsoDate(value.from));

  return `${formatters.short.format(fromIsoDate(value.from))} – ${formatters.short.format(fromIsoDate(value.to))}`;
}

/**
 * Presets, a two-month calendar and date inputs. Meant to sit inside a popover:
 * it keeps a draft and only reports it on "apply".
 *
 * @param {{preset: string, from: string, to: string}|null} value - ISO "YYYY-MM-DD" dates, both inclusive
 * @param {function} onApply       - Called with the applied `{ preset, from, to }`
 * @param {function} onCancel      - Called on "cancel"
 * @param {function} onClear       - Optional, shows a "clear" action while a value is applied
 * @param {function} onReset       - Optional, shows a "reset" action while a value is applied
 * @param {Array}    presets       - [{ key, label }] subset of DATE_RANGE_PRESETS
 * @param {boolean}  allowCustom   - Show the "custom range" option
 * @param {string}   minDate       - Earliest selectable ISO date
 * @param {string|null} maxDate    - Latest selectable ISO date (default today, null → no limit)
 * @param {string}   locale        - "tr" | "en", date formats and built-in texts
 * @param {object}   labels        - Text overrides, see labels.js
 */
export function DateRangePanel({
  value,
  onApply,
  onCancel,
  onClear,
  onReset,
  presets = DATE_RANGE_PRESETS,
  allowCustom = true,
  minDate,
  maxDate,
  locale = "tr",
  labels: labelOverrides,
}) {
  const labels = resolveLabels(locale, labelOverrides);
  const formatters = useDateRangeFormatters(locale);
  const today = todayIso();
  const upperBound = maxDate === undefined ? today : maxDate;

  // The panel mounts when its popover opens, so the draft starts from the applied value
  const [draft, setDraft] = useState(() => value ?? { preset: CUSTOM_PRESET, from: null, to: null });
  const [hoverDate, setHoverDate] = useState(null);
  const [leftMonth, setLeftMonth] = useState(() => getLeftMonth(value?.to ?? today));

  const rightMonth = addMonths(leftMonth, 1);
  const canGoNext = !upperBound || rightMonth < startOfMonth(upperBound);
  const canGoPrev = !minDate || leftMonth > startOfMonth(minDate);

  function isDisabled(day) {
    return Boolean((upperBound && day > upperBound) || (minDate && day < minDate));
  }

  function showRange(to) {
    setLeftMonth(getLeftMonth(to ?? today));
  }

  // "All time" applies without dates
  const canApply = draft.preset === ALL_PRESET || Boolean(draft.from && draft.to);

  function handlePresetSelect(key) {
    if (key === CUSTOM_PRESET) {
      setDraft((prev) => ({ ...prev, preset: CUSTOM_PRESET }));
      return;
    }

    const range = createPresetRange(key, today);
    setDraft(range);
    showRange(range.to);
  }

  function handleDaySelect(day) {
    setDraft((prev) => {
      if (prev.from && !prev.to && day >= prev.from) {
        return { preset: CUSTOM_PRESET, from: prev.from, to: day };
      }

      return { preset: CUSTOM_PRESET, from: day, to: null };
    });
  }

  function handleInputChange(field, inputValue) {
    if (!isIsoDate(inputValue) || isDisabled(inputValue)) {
      return;
    }

    setDraft((prev) => {
      const next = { ...prev, preset: CUSTOM_PRESET, [field]: inputValue };

      if (next.from && next.to && next.from > next.to) {
        next[field === "from" ? "to" : "from"] = inputValue;
      }

      return next;
    });
    showRange(field === "to" ? inputValue : addMonths(inputValue, 1));
  }

  function handleApply() {
    if (canApply) onApply?.(draft);
  }

  // "Custom" comes right after "All time", or first without it
  const customIndex = presets[0]?.key === ALL_PRESET ? 1 : 0;
  const options = allowCustom
    ? [...presets.slice(0, customIndex), { key: CUSTOM_PRESET, label: labels.custom }, ...presets.slice(customIndex)]
    : presets;
  const draftDays = draft.from && draft.to ? countDays(draft.from, draft.to) : 0;

  const navButton = (direction) => {
    const isPrev = direction === "prev";
    const Icon = isPrev ? ChevronLeft : ChevronRight;

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        disabled={isPrev ? !canGoPrev : !canGoNext}
        onClick={() => setLeftMonth((prev) => addMonths(prev, isPrev ? -1 : 1))}
        aria-label={isPrev ? labels.previousMonth : labels.nextMonth}
        className={cn(!isPrev && "sm:hidden")}
      >
        <Icon />
      </Button>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row">
      {/* On wide screens the list takes the calendar's height and scrolls instead of stretching the popover */}
      <div className="relative shrink-0 border-b sm:w-44 sm:border-r sm:border-b-0">
        <ul className="flex gap-1 overflow-x-auto p-2 sm:absolute sm:inset-0 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto">
          {options.map((option) => {
            const active = draft.preset === option.key;

            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(option.key)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors hover:bg-muted",
                    active && "bg-muted font-medium",
                  )}
                >
                  {getPresetLabel(labels, option)}
                  {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-col">
        <div className="flex gap-6 p-3" onMouseLeave={() => setHoverDate(null)}>
          <CalendarMonth
            month={leftMonth}
            draft={draft}
            hoverDate={hoverDate}
            today={today}
            isDisabled={isDisabled}
            onSelect={handleDaySelect}
            onHover={setHoverDate}
            formatters={formatters}
            header={{ start: navButton("prev"), end: navButton("next") }}
          />
          <div className="hidden sm:block">
            <CalendarMonth
              month={rightMonth}
              draft={draft}
              hoverDate={hoverDate}
              today={today}
              isDisabled={isDisabled}
              onSelect={handleDaySelect}
              onHover={setHoverDate}
              formatters={formatters}
              header={{
                end: (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    disabled={!canGoNext}
                    onClick={() => setLeftMonth((prev) => addMonths(prev, 1))}
                    aria-label={labels.nextMonth}
                  >
                    <ChevronRight />
                  </Button>
                ),
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 border-t p-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {labels.startDate}
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={draft.from ?? ""}
              min={minDate}
              max={upperBound ?? undefined}
              onChange={(event) => handleInputChange("from", event.target.value)}
            />
          </label>
          <ArrowRight className="mb-2 size-4 text-muted-foreground" aria-hidden="true" />
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {labels.endDate}
            <input
              type="date"
              className={DATE_INPUT_CLASS}
              value={draft.to ?? ""}
              min={draft.from ?? minDate}
              max={upperBound ?? undefined}
              onChange={(event) => handleInputChange("to", event.target.value)}
            />
          </label>
          <span className="mb-1.5 w-20 shrink-0 text-sm text-muted-foreground tabular-nums">
            {draftDays > 0 && formatLabel(labels.dayCount, { count: draftDays })}
          </span>
          <div className="ml-auto flex gap-2">
            {onReset && value && (
              <Button type="button" variant="secondary" size="sm" onClick={onReset}>
                {labels.reset}
              </Button>
            )}
            {onClear && value && (
              <Button type="button" variant="secondary" size="sm" onClick={onClear}>
                {labels.clear}
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
              {labels.cancel}
            </Button>
            <Button type="button" size="sm" disabled={!canApply} onClick={handleApply}>
              {labels.apply}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Controlled date range picker: a trigger button with the DateRangePanel in a popover.
 *
 * @param {{preset: string, from: string, to: string}|null} value - ISO "YYYY-MM-DD" dates, both inclusive
 * @param {function} onChange      - Called with the applied `{ preset, from, to }`
 * @param {boolean}  clearable     - Show a "clear" action that calls onChange(null)
 * @param {string|null} resetPreset - Show a "reset" action back to this preset while another range is applied
 * @param {string}   align         - Popover alignment relative to the trigger
 * @param {string}   className     - Extra classes for the trigger
 * @param {string|function} dateFormat - Trigger dates: "locale" (default), "iso" ("2026-10-01") or (isoDate) => string
 * Remaining props are forwarded to DateRangePanel (presets, allowCustom, minDate, maxDate, locale, labels).
 */
export function DateRangePicker({
  value,
  onChange,
  clearable = false,
  resetPreset = null,
  align = "end",
  className,
  disabled = false,
  dateFormat = "locale",
  ...panelProps
}) {
  const labels = resolveLabels(panelProps.locale, panelProps.labels);
  const formatters = useDateRangeFormatters(panelProps.locale, dateFormat);
  const [open, setOpen] = useState(false);

  const presets = panelProps.presets ?? DATE_RANGE_PRESETS;
  const activeOption = [...presets, { key: CUSTOM_PRESET, label: labels.custom }].find((option) => option.key === value?.preset);
  const triggerLabel = activeOption ? getPresetLabel(labels, activeOption) : labels.dateRange;

  function apply(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={labels.dateRange}
          className={cn(
            "inline-flex h-8 max-w-full cursor-pointer items-stretch overflow-hidden rounded-lg whitespace-nowrap border border-input bg-background text-sm shadow-xs transition-colors outline-none hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:border-primary dark:bg-input/30",
            className,
          )}
        >
          <span className="flex items-center gap-1.5 border-r border-input px-2.5 font-medium">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
            {triggerLabel}
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </span>
          {value?.from && value?.to && (
            <span className="flex items-center gap-1.5 px-2.5 tabular-nums" suppressHydrationWarning>
              {formatters.short.format(fromIsoDate(value.from))}
              <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {formatters.short.format(fromIsoDate(value.to))}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <DateRangePanel
          {...panelProps}
          value={value}
          onApply={apply}
          onCancel={() => setOpen(false)}
          onClear={clearable ? () => apply(null) : undefined}
          onReset={resetPreset && value?.preset !== resetPreset ? () => apply(createPresetRange(resetPreset)) : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
