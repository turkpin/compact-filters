"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ListFilter, Search, X } from "../icons";
import { cn } from "../cn";
import { resolveLabels } from "../labels";
import { Button } from "../primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../primitives/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { DateRangePanel, formatDateRangeLabel, useDateRangeFormatters } from "../date-range/date-range-picker";

const SEARCHABLE_OPTION_THRESHOLD = 8;

/**
 * Compact, dynamic filter bar: filters are added from the "Filter" menu and shown as chips.
 * Clicking a chip changes its value, × removes it (back to its default value).
 *
 * @param {Array}    filters  - Filter definitions:
 *                              select:     { key, label, icon?, options: [{ value, label }], defaultValue, searchable?, onSearchChange?, valueLabel? }
 *                              date range: { key, label, icon?, type: "dateRange", defaultValue: null, presets?, allowOpenRange?, minDate?, maxDate?, emptyValues?, emptyValuesHint? }
 *                              `defaultValue` means "not filtering" and is not listed in `options`.
 *                              `onSearchChange` (query) => void makes the option search remote: the typed text goes to the app,
 *                              which passes the matching `options` back; they are not filtered here. "" again on close.
 *                              `valueLabel` is the chip text for a value that is not in `options`.
 *                              A date range value is { preset, from, to } with inclusive ISO "YYYY-MM-DD" dates.
 *                              `allowOpenRange` also applies only a start or only an end day, the other one null.
 *                              `minDate` / `maxDate` limit the calendar like DateRangePicker (`maxDate` today by default, null → no limit).
 *                              `emptyValues` offers "show empty ones too", the value then gets `includeEmpty: true`;
 *                              `emptyValuesHint` replaces the generic text of its info popover.
 * @param {object}   values   - { [key]: value } current values, including the search key
 * @param {function} onChange - (patch) => void, called with the changed keys only, e.g. { status: "paid" }
 * @param {object}   search   - Optional search input: { key, placeholder }
 * @param {string}   locale   - "tr" | "en", built-in texts and date formats
 * @param {string|function} dateFormat - Custom range dates: "locale" (default), "iso" ("2026-10-01") or (isoDate) => string
 * @param {object}   labels   - Overrides for the built-in texts, see labels.js
 * @param {string}   className
 */
export function FilterBar({
  filters = [],
  values = {},
  onChange,
  search,
  locale = "tr",
  dateFormat = "locale",
  labels: labelOverrides,
  className,
}) {
  const labels = resolveLabels(locale, labelOverrides);
  const formatters = useDateRangeFormatters(locale, dateFormat);
  const [openKey, setOpenKey] = useState(null);
  const [pendingKey, setPendingKey] = useState(null);
  const addingKeyRef = useRef(null);

  const activeKeys = useMemo(
    () => filters.filter((filter) => isFilterActive(filter, values)).map((filter) => filter.key),
    [filters, values],
  );

  const visibleFilters = filters.filter(
    (filter) => activeKeys.includes(filter.key) || filter.key === pendingKey,
  );

  const searchValue = search ? (values[search.key] ?? "") : "";
  const hasAnyValue = activeKeys.length > 0 || !!searchValue;

  function handleAdd(key) {
    // The popover opens once the menu has closed, otherwise the closing menu steals focus and dismisses it
    addingKeyRef.current = key;
    if (!activeKeys.includes(key)) setPendingKey(key);
  }

  function handleOpenChange(key, open) {
    if (open) {
      setOpenKey(key);
      return;
    }
    setOpenKey((prev) => (prev === key ? null : prev));
    setPendingKey((prev) => (prev === key ? null : prev));
  }

  function handleSelect(filter, value) {
    onChange?.({ [filter.key]: value });
    setOpenKey(null);
    setPendingKey(null);
  }

  function handleRemove(filter) {
    if (filter.key === pendingKey) setPendingKey(null);
    if (isFilterActive(filter, values)) onChange?.({ [filter.key]: filter.defaultValue });
  }

  function handleClearAll() {
    const patch = Object.fromEntries(filters.map((filter) => [filter.key, filter.defaultValue]));
    if (search) patch[search.key] = "";
    setPendingKey(null);
    onChange?.(patch);
  }

  return (
    <div
      className={cn(
        "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-card p-0.5 transition-[border-color,box-shadow] focus-within:border-ring/60",
        className,
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6.5 gap-1.5 px-2 text-xs font-medium", activeKeys.length > 0 && "text-primary")}
          >
            <ListFilter className="size-3.5" />
            <span className="hidden sm:inline">{labels.filter}</span>
            {activeKeys.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground tabular-nums">
                {activeKeys.length}
              </span>
            )}
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56"
          onCloseAutoFocus={(event) => {
            if (!addingKeyRef.current) return;
            event.preventDefault();
            setOpenKey(addingKeyRef.current);
            addingKeyRef.current = null;
          }}
        >
          {filters.map((filter) => {
            const Icon = filter.icon;
            const active = activeKeys.includes(filter.key);
            return (
              <DropdownMenuItem key={filter.key} onSelect={() => handleAdd(filter.key)} className="text-sm">
                {Icon ? <Icon className="text-muted-foreground" /> : null}
                <span className="flex-1 truncate">{filter.label}</span>
                {active && (
                  <span className="max-w-24 truncate text-xs text-primary">
                    {getValueLabel(filter, values[filter.key], labels, formatters)}
                  </span>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {visibleFilters.map((filter) => (
        <FilterChip
          key={filter.key}
          filter={filter}
          value={values[filter.key]}
          pending={!activeKeys.includes(filter.key)}
          open={openKey === filter.key}
          locale={locale}
          dateFormat={dateFormat}
          labels={labels}
          onOpenChange={(open) => handleOpenChange(filter.key, open)}
          onSelect={(value) => handleSelect(filter, value)}
          onRemove={() => handleRemove(filter)}
        />
      ))}

      <div className="flex min-w-48 flex-1 items-center">
        {search ? (
          <label className="flex h-6.5 min-w-0 flex-1 items-center gap-1.5 px-2 text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onChange?.({ [search.key]: event.target.value })}
              placeholder={search.placeholder ?? labels.search}
              aria-label={search.placeholder ?? labels.search}
              className="h-full w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
            />
          </label>
        ) : (
          <div className="flex-1" />
        )}

        {hasAnyValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="ml-auto h-6.5 shrink-0 px-2 text-xs text-muted-foreground"
          >
            {labels.clear}
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterChip({ filter, value, pending, open, locale, dateFormat, labels, onOpenChange, onSelect, onRemove }) {
  const formatters = useDateRangeFormatters(locale, dateFormat);
  const Icon = filter.icon;
  const valueLabel = pending ? labels.select : getValueLabel(filter, value, labels, formatters);

  return (
    <div
      className={cn(
        "inline-flex h-6.5 max-w-full items-center overflow-hidden rounded-md border text-xs transition-colors",
        pending
          ? "border-dashed border-input bg-muted/50 text-muted-foreground"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-full min-w-0 cursor-pointer items-center gap-1 pr-1 pl-2 outline-none hover:bg-primary/10 focus-visible:bg-primary/15"
          >
            {Icon ? <Icon className="size-3.5 shrink-0" /> : null}
            <span className="shrink-0 opacity-75">{filter.label}:</span>
            {/* A date range with "+ empty" needs more room than an option label */}
            <span className={cn("truncate font-medium", filter.type === "dateRange" ? "max-w-60" : "max-w-40")} title={valueLabel}>
              {valueLabel}
            </span>
            <ChevronDown className="size-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        {filter.type === "dateRange" ? (
          <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-0">
            <DateRangePanel
              value={pending ? null : value}
              presets={filter.presets}
              allowOpenRange={filter.allowOpenRange}
              minDate={filter.minDate}
              maxDate={filter.maxDate}
              emptyValues={filter.emptyValues}
              emptyValuesHint={filter.emptyValuesHint}
              locale={locale}
              labels={labels}
              onApply={onSelect}
              onCancel={() => onOpenChange(false)}
            />
          </PopoverContent>
        ) : (
          <PopoverContent className="w-60 p-0">
            <FilterOptions filter={filter} value={value} labels={labels} onSelect={onSelect} />
          </PopoverContent>
        )}
      </Popover>
      <button
        type="button"
        onClick={onRemove}
        aria-label={labels.removeFilter}
        title={labels.removeFilter}
        className={cn(
          "flex h-full cursor-pointer items-center border-l px-1.5 outline-none",
          pending
            ? "border-input hover:bg-muted"
            : "border-primary/20 hover:bg-primary/15 focus-visible:bg-primary/15",
        )}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function FilterOptions({ filter, value, labels, onSelect }) {
  const [query, setQuery] = useState("");
  const listRef = useRef(null);
  const options = filter.options;
  // With onSearchChange the app searches, e.g. an API that returns one page of options
  const remoteSearch = typeof filter.onSearchChange === "function";
  const searchable = filter.searchable ?? (remoteSearch || (options?.length ?? 0) > SEARCHABLE_OPTION_THRESHOLD);

  const visibleOptions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    if (!needle || remoteSearch) return options ?? [];
    return (options ?? []).filter((option) => String(option.label).toLocaleLowerCase("tr").includes(needle));
  }, [options, query, remoteSearch]);

  // The list opens with an empty search box, so the app gets "" back when it closes
  const lastSearchRef = useRef(null);
  useEffect(() => {
    lastSearchRef.current = { query, onSearchChange: filter.onSearchChange };
  });
  useEffect(
    () => () => {
      const last = lastSearchRef.current;
      if (last?.query && typeof last.onSearchChange === "function") last.onSearchChange("");
    },
    [],
  );

  function handleQueryChange(event) {
    setQuery(event.target.value);
    if (remoteSearch) filter.onSearchChange(event.target.value);
  }

  function focusOption(offset) {
    const items = Array.from(listRef.current?.querySelectorAll("[data-filter-option]") ?? []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    const next = index === -1 ? (offset > 0 ? 0 : items.length - 1) : (index + offset + items.length) % items.length;
    items[next].focus();
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(-1);
    } else if (event.key === "Enter" && event.target.tagName === "INPUT" && visibleOptions.length === 1) {
      event.preventDefault();
      onSelect(visibleOptions[0].value);
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      <div className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {filter.label}
      </div>
      {searchable && (
        <div className="px-2 pb-1.5">
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-input px-2 focus-within:border-ring">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={handleQueryChange}
              placeholder={labels.searchOptions}
              className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      )}
      <div ref={listRef} role="listbox" aria-label={filter.label} className="max-h-64 overflow-y-auto p-1 pt-0">
        {visibleOptions.length ? (
          visibleOptions.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                data-filter-option=""
                onClick={() => onSelect(option.value)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent",
                  selected && "font-medium text-primary",
                )}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {selected && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })
        ) : (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">{labels.noResults}</div>
        )}
      </div>
    </div>
  );
}

function isFilterActive(filter, values) {
  const value = values[filter.key];
  return value !== undefined && value !== null && value !== "" && value !== filter.defaultValue;
}

function getValueLabel(filter, value, labels, formatters) {
  if (filter.type === "dateRange") return formatDateRangeLabel(value, labels, formatters);
  return filter.options?.find((option) => option.value === value)?.label ?? filter.valueLabel ?? value;
}
