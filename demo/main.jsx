import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { DATE_RANGE_PRESETS, ALL_PRESET, FilterBar } from "../src/index.js";

// A fake invoice list, the same every time so screenshots stay stable
const CUSTOMERS = [
  "Ada Yılmaz", "Can Demir", "Elif Kaya", "Mert Şahin", "Zeynep Çelik", "Deniz Aydın", "Ece Arslan",
  "Kerem Doğan", "Selin Koç", "Burak Kurt", "İrem Özdemir", "Emre Aslan", "Naz Polat", "Onur Erdem",
];
// Like an API that returns one page of customers, so the filter searches through onSearchChange
const CUSTOMER_PAGE_SIZE = 10;
function fetchCustomers(query) {
  const needle = query.trim().toLocaleLowerCase("tr");
  const page = CUSTOMERS.filter((customer) => customer.toLocaleLowerCase("tr").includes(needle)).slice(0, CUSTOMER_PAGE_SIZE);
  return new Promise((resolve) => setTimeout(() => resolve(page.map((customer) => ({ value: customer, label: customer }))), 150));
}

const STATUSES = ["paid", "unpaid", "refunded"];
const CHANNELS = ["web", "mobile", "store"];

const INVOICES = Array.from({ length: 42 }, (_, index) => {
  const day = 1 + ((index * 7) % 15);
  return {
    id: 1040 + index,
    customer: CUSTOMERS[index % CUSTOMERS.length],
    status: STATUSES[(index * 5) % 3],
    channel: CHANNELS[(index * 2) % 3],
    date: `2026-10-${String(day).padStart(2, "0")}`,
    total: 120 + ((index * 137) % 900),
  };
});

const TEXTS = {
  en: {
    title: "Invoices",
    status: "Status", paid: "Paid", unpaid: "Unpaid", refunded: "Refunded",
    channel: "Channel", web: "Web", mobile: "Mobile", store: "Store",
    customer: "Customer", date: "Date Range", search: "Search by customer or number",
    columns: ["#", "Customer", "Status", "Channel", "Date", "Total"], empty: "No invoices",
  },
  tr: {
    title: "Faturalar",
    status: "Durum", paid: "Ödendi", unpaid: "Ödenmedi", refunded: "İade",
    channel: "Kanal", web: "Web", mobile: "Mobil", store: "Mağaza",
    customer: "Müşteri", date: "Tarih Aralığı", search: "Müşteri veya numara ara",
    columns: ["#", "Müşteri", "Durum", "Kanal", "Tarih", "Tutar"], empty: "Fatura yok",
  },
};

function readInitialValues() {
  // ?state=<json> lets the screenshot script open the page with filters already set
  try {
    const state = new URLSearchParams(window.location.search).get("state");
    if (state) return JSON.parse(state);
  } catch {}
  return { status: "all", channel: "all", customer: "all", date: null, q: "" };
}

// Links that keep the other settings, e.g. switch to dark mode and stay in Turkish
function settingHref(key, value) {
  const params = new URLSearchParams(window.location.search);
  params.set(key, value);
  params.delete("state");
  return `?${params}`;
}

function Switch({ name, current, options }) {
  return (
    <div className="flex overflow-hidden rounded-md border text-xs">
      {options.map(([value, label]) => (
        <a
          key={value}
          href={settingHref(name, value)}
          aria-current={current === value ? "true" : undefined}
          className="px-2 py-1 text-muted-foreground hover:bg-muted aria-[current]:bg-primary aria-[current]:text-primary-foreground"
        >
          {label}
        </a>
      ))}
    </div>
  );
}

function Demo() {
  const params = new URLSearchParams(window.location.search);
  const locale = params.get("locale") === "tr" ? "tr" : "en";
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  // Screenshots hide the demo's own controls
  const showToolbar = params.get("toolbar") !== "0";
  const text = TEXTS[locale];
  const [values, setValues] = useState(readInitialValues);
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOptions, setCustomerOptions] = useState([]);

  useEffect(() => {
    let current = true;
    fetchCustomers(customerQuery).then((options) => current && setCustomerOptions(options));
    return () => {
      current = false;
    };
  }, [customerQuery]);

  const filters = useMemo(
    () => [
      {
        key: "status",
        label: text.status,
        defaultValue: "all",
        options: STATUSES.map((status) => ({ value: status, label: text[status] })),
      },
      {
        key: "channel",
        label: text.channel,
        defaultValue: "all",
        options: CHANNELS.map((channel) => ({ value: channel, label: text[channel] })),
      },
      {
        key: "customer",
        label: text.customer,
        defaultValue: "all",
        options: customerOptions,
        onSearchChange: setCustomerQuery,
        // The picked customer may not be on the loaded page
        valueLabel: values.customer,
      },
      {
        key: "date",
        label: text.date,
        type: "dateRange",
        defaultValue: null,
        presets: DATE_RANGE_PRESETS.filter((preset) => preset.key !== ALL_PRESET),
        allowOpenRange: true,
      },
    ],
    [text, customerOptions, values.customer],
  );

  const rows = INVOICES.filter((invoice) => {
    if (values.status !== "all" && invoice.status !== values.status) return false;
    if (values.channel !== "all" && invoice.channel !== values.channel) return false;
    if (values.customer !== "all" && invoice.customer !== values.customer) return false;
    if (values.date?.from && invoice.date < values.date.from) return false;
    if (values.date?.to && invoice.date > values.date.to) return false;
    const q = values.q.trim().toLocaleLowerCase(locale);
    return !q || invoice.customer.toLocaleLowerCase(locale).includes(q) || String(invoice.id).includes(q);
  });

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{text.title}</h1>
        {showToolbar && (
          <div className="flex items-center gap-2">
            <Switch name="locale" current={locale} options={[["en", "EN"], ["tr", "TR"]]} />
            <Switch name="theme" current={theme} options={[["light", "Light"], ["dark", "Dark"]]} />
            <a
              href="https://github.com/turkpin/compact-filters"
              className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              GitHub
            </a>
          </div>
        )}
      </div>
      <FilterBar
        locale={locale}
        filters={filters}
        values={values}
        onChange={(changes) => setValues((prev) => ({ ...prev, ...changes }))}
        search={{ key: "q", placeholder: text.search }}
      />
      <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              {text.columns.map((column) => (
                <th key={column} className="px-3 py-2 font-medium">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((invoice) => (
              <tr key={invoice.id} className="border-b last:border-0">
                <td className="px-3 py-2 text-muted-foreground tabular-nums">{invoice.id}</td>
                <td className="px-3 py-2">{invoice.customer}</td>
                <td className="px-3 py-2">{text[invoice.status]}</td>
                <td className="px-3 py-2">{text[invoice.channel]}</td>
                <td className="px-3 py-2 tabular-nums">{invoice.date}</td>
                <td className="px-3 py-2 text-right tabular-nums">{invoice.total.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">{text.empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

if (new URLSearchParams(window.location.search).get("theme") === "dark") {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(<Demo />);
