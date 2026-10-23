import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { DateRangePanel, DateRangePicker, FilterBar } from "../dist/index.js";

// Smoke tests against the build output, run `npm run build` first

const filters = [
  { key: "status", label: "Durum", options: [{ value: "paid", label: "Ödenmiş" }], defaultValue: "all" },
  { key: "date", label: "Tarih Aralığı", type: "dateRange", defaultValue: null },
];

describe("FilterBar", () => {
  it("renders active filters as chips", () => {
    const html = renderToString(
      h(FilterBar, {
        filters,
        values: { status: "paid", date: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, q: "" },
        search: { key: "q", placeholder: "Ara..." },
      }),
    );

    assert.match(html, /Filtrele/);
    assert.match(html, /Ödenmiş/);
    assert.match(html, /Bu ay/);
    assert.match(html, /Ara\.\.\./);
  });

  it("labels a value outside the options with valueLabel", () => {
    const customer = { key: "customer", label: "Müşteri", options: [{ value: 7, label: "Can Demir" }], defaultValue: "all" };

    assert.match(renderToString(h(FilterBar, { filters: [customer], values: { customer: 42 } })), /title="42"/);
    assert.match(renderToString(h(FilterBar, { filters: [{ ...customer, valueLabel: "Ada Yılmaz" }], values: { customer: 42 } })), /Ada Yılmaz/);
    assert.match(renderToString(h(FilterBar, { filters: [{ ...customer, valueLabel: "Eski ad" }], values: { customer: 7 } })), /title="Can Demir"/);
  });

  it("hides filters on their default value", () => {
    const html = renderToString(h(FilterBar, { filters, values: { status: "all", date: null } }));

    assert.doesNotMatch(html, /Ödenmiş/);
    assert.doesNotMatch(html, /Temizle/);
  });

  it("uses English texts and label overrides", () => {
    const html = renderToString(
      h(FilterBar, {
        locale: "en",
        labels: { filter: "Refine" },
        filters,
        values: { date: { preset: "last7Days", from: "2026-10-09", to: "2026-10-15" } },
      }),
    );

    assert.match(html, /Refine/);
    assert.match(html, /Last 7 days/);
    assert.match(html, /Clear/);
  });

  it("shows custom ranges as dates", () => {
    const html = renderToString(
      h(FilterBar, { filters, values: { date: { preset: "custom", from: "2026-09-02", to: "2026-09-10" } } }),
    );

    assert.match(html, /02\.09\.2026 – 10\.09\.2026/);
  });

  it("shows custom ranges in the given date format", () => {
    const values = { date: { preset: "custom", from: "2026-09-02", to: "2026-09-10" } };

    assert.match(renderToString(h(FilterBar, { filters, values, dateFormat: "iso" })), /2026-09-02 – 2026-09-10/);
    assert.match(
      renderToString(h(FilterBar, { filters, values, dateFormat: (date) => date.replaceAll("-", "/") })),
      /2026\/09\/02 – 2026\/09\/10/,
    );
  });

  it("marks a range that includes empty values", () => {
    const values = { date: { preset: "custom", from: "2026-10-10", to: null, includeEmpty: true } };

    assert.match(renderToString(h(FilterBar, { filters, values })), /10\.10\.2026 ve sonrası \+ boşlar/);
    assert.match(renderToString(h(FilterBar, { filters, values, locale: "en", dateFormat: "iso" })), /From 2026-10-10 \+ empty/);
    assert.doesNotMatch(renderToString(h(FilterBar, { filters, values: { date: { preset: "allTime", from: null, to: null, includeEmpty: true } } })), /\+ boşlar/);
  });

  it("shows open ranges with their single day", () => {
    const openFilters = filters.map((filter) => (filter.type === "dateRange" ? { ...filter, allowOpenRange: true } : filter));

    assert.match(
      renderToString(h(FilterBar, { filters: openFilters, values: { date: { preset: "custom", from: "2026-10-01", to: null } } })),
      /01\.10\.2026 ve sonrası/,
    );
    assert.match(
      renderToString(
        h(FilterBar, { locale: "en", dateFormat: "iso", filters: openFilters, values: { date: { preset: "custom", from: null, to: "2026-10-31" } } }),
      ),
      /Until 2026-10-31/,
    );
  });
});

describe("DateRangePicker", () => {
  it("renders the trigger with the applied preset", () => {
    const html = renderToString(
      h(DateRangePicker, { value: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, onChange: () => {} }),
    );

    assert.match(html, /Bu ay/);
    assert.match(html, /01\.10\.2026/);
  });

  it("renders the trigger dates in the given date format", () => {
    const html = renderToString(
      h(DateRangePicker, { value: { preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }, dateFormat: "iso" }),
    );

    assert.match(html, /2026-10-01/);
    assert.match(html, /2026-10-15/);
    assert.doesNotMatch(html, /01\.10\.2026/);
  });

  it("renders the trigger with an open range", () => {
    const html = renderToString(h(DateRangePicker, { value: { preset: "custom", from: "2026-10-01", to: null }, allowOpenRange: true }));

    assert.match(html, /01\.10\.2026 ve sonrası/);
  });

  it("falls back to the placeholder without a value", () => {
    assert.match(renderToString(h(DateRangePicker, { value: null, locale: "en" })), /Date Range/);
  });
});

describe("DateRangePanel", () => {
  const applyDisabled = (html) => /<button[^>]*disabled=""[^>]*>Uygula<\/button>/.test(html);

  it("applies a single day only with allowOpenRange", () => {
    const value = { preset: "custom", from: "2026-10-01", to: null };

    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value }))), true);
    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value, allowOpenRange: true }))), false);
    assert.equal(applyDisabled(renderToString(h(DateRangePanel, { value: { preset: "custom", from: null, to: null }, allowOpenRange: true }))), true);
  });

  it("limits the days to today unless maxDate is null", () => {
    const value = { preset: "custom", from: "2026-10-01", to: null };

    assert.match(renderToString(h(DateRangePanel, { value })), /type="date"[^>]*max="\d{4}-\d{2}-\d{2}"/);
    assert.doesNotMatch(renderToString(h(DateRangePanel, { value, maxDate: null })), /max="/);
    assert.match(renderToString(h(DateRangePanel, { value, maxDate: "2027-12-31" })), /max="2027-12-31"/);
  });

  it("opens on the start day of an open range", () => {
    const html = renderToString(h(DateRangePanel, { value: { preset: "custom", from: "2027-03-10", to: null }, allowOpenRange: true, maxDate: null }));

    assert.match(html, /10 Mart 2027/);
  });

  it("offers empty values only with emptyValues", () => {
    const value = { preset: "custom", from: "2026-10-01", to: null };
    const checkbox = (html) => html.match(/<input type="checkbox"[^>]*>/)?.[0];

    assert.equal(checkbox(renderToString(h(DateRangePanel, { value }))), undefined);
    assert.doesNotMatch(checkbox(renderToString(h(DateRangePanel, { value, emptyValues: true }))), /checked/);
    assert.match(checkbox(renderToString(h(DateRangePanel, { value: { ...value, includeEmpty: true }, emptyValues: true }))), /checked/);
    assert.match(renderToString(h(DateRangePanel, { value, emptyValues: true })), /Boş olanları da göster/);
  });

  it("offers empty values only next to dates", () => {
    const checkbox = (html) => html.match(/<input type="checkbox"[^>]*>/)[0];

    assert.match(checkbox(renderToString(h(DateRangePanel, { value: { preset: "allTime", from: null, to: null }, emptyValues: true }))), /disabled=""/);
    assert.doesNotMatch(checkbox(renderToString(h(DateRangePanel, { value: { preset: "custom", from: "2026-10-01", to: null }, emptyValues: true }))), /disabled=""/);
  });

  it("gives screen readers the empty values hint", () => {
    const html = renderToString(h(DateRangePanel, { value: { preset: "custom", from: "2026-10-01", to: null }, emptyValues: true, emptyValuesHint: "Okunmamış mesajlar" }));
    const id = html.match(/aria-describedby="([^"]+)"/)[1];

    assert.match(html, new RegExp(`<span id="${id}" class="sr-only">Okunmamış mesajlar</span>`));
    assert.equal(html.match(new RegExp(`aria-describedby="${id}"`, "g")).length, 2);
  });

  describe("on a narrow screen", () => {
    // One month only: the left one
    const firstMonth = (html) => html.match(/aria-label="\d{1,2} (\S+ \d{4})/)[1];
    const nextDisabled = (html) => /<button[^>]*disabled=""[^>]*aria-label="Sonraki ay"/.test(html);
    const renderNarrow = (props) => {
      globalThis.window = { matchMedia: () => ({ matches: false }) };
      try {
        return renderToString(h(DateRangePanel, { allowOpenRange: true, ...props }));
      } finally {
        delete globalThis.window;
      }
    };

    it("opens on the start day of an open range", () => {
      assert.equal(firstMonth(renderNarrow({ value: { preset: "custom", from: "2027-03-10", to: null }, maxDate: null })), "Mart 2027");
    });

    it("goes on to the month of the last selectable day", () => {
      const html = renderNarrow({ value: { preset: "custom", from: "2026-11-15", to: null }, maxDate: "2026-12-31" });

      assert.equal(firstMonth(html), "Kasım 2026");
      assert.equal(nextDisabled(html), false);
      assert.equal(nextDisabled(renderNarrow({ value: { preset: "custom", from: "2026-12-15", to: null }, maxDate: "2026-12-31" })), true);
    });
  });
});
