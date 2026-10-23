# @turkpin/compact-filters

**English** · [Türkçe](https://github.com/turkpin/compact-filters/blob/main/docs/README.tr.md)

A small filter bar for React lists. Pick a filter, choose a value, done.

**[Try the live demo →](https://turkpin.github.io/compact-filters/)**

![The filter bar with two active filters above an invoice list](docs/screenshots/filter-bar.png)

- Filters stay hidden until you use them, so the bar stays small.
- Each active filter is a chip: click it to change the value, click **×** to remove it.
- It comes with a date range picker: "Today", "This month", "Last 30 days"… or any two days on a calendar.
- It speaks Turkish and English.
- It is light: about 15 kB, no icon library, and it uses your app's colors.

## See it

| Pick a filter | Search a long list |
|---|---|
| ![The Filter menu](docs/screenshots/filter-menu.png) | ![A customer list with a search box](docs/screenshots/filter-options.png) |
| **Pick dates** | **Dark mode** |
| ![The date range picker](docs/screenshots/date-range.png) | ![The filter bar in dark mode](docs/screenshots/dark.png) |
| **Turkish** | **On a phone** |
| ![The filter bar in Turkish](docs/screenshots/turkish.png) | ![The date picker on a phone](docs/screenshots/mobile.png) |

## 1. Install

```sh
npm install @turkpin/compact-filters
```

It also needs these packages. If your app uses [shadcn/ui](https://ui.shadcn.com/), you most likely have them already:

```sh
npm install react react-dom @radix-ui/react-popover @radix-ui/react-dropdown-menu tailwind-merge
```

## 2. Let Tailwind see it

The filter bar is styled with [Tailwind CSS v4](https://tailwindcss.com/). Add one line to your main CSS file so Tailwind finds its classes:

```css
@import "tailwindcss";
@source "../node_modules/@turkpin/compact-filters/dist";
```

The path starts from your CSS file. Fix the `../` part if your CSS file sits deeper.

## 3. Use it

```jsx
"use client";

import { useState } from "react";
import { FilterBar } from "@turkpin/compact-filters";

const filters = [
  {
    key: "status",
    label: "Status",
    defaultValue: "all",
    options: [
      { value: "paid", label: "Paid" },
      { value: "unpaid", label: "Unpaid" },
    ],
  },
  {
    key: "date",
    label: "Date Range",
    type: "dateRange",
    defaultValue: null,
  },
];

export function Invoices() {
  const [values, setValues] = useState({ status: "all", date: null, q: "" });

  return (
    <FilterBar
      locale="en"
      filters={filters}
      values={values}
      onChange={(changes) => setValues({ ...values, ...changes })}
      search={{ key: "q", placeholder: "Search invoices" }}
    />
  );
}
```

That is all. Here is what each part does:

- **`filters`** is the list of filters the user can pick from.
- **`values`** holds what is picked right now.
- **`onChange`** tells you what changed, for example `{ status: "paid" }`. Put it into your state, then load your list with the new values.
- **`search`** adds a search box. Leave it out if you do not need one.
- **`locale`** is `"tr"` (the default) or `"en"`.

## Two kinds of filters

### A list of choices

```js
{
  key: "status",          // the name in `values`
  label: "Status",        // the text the user sees
  defaultValue: "all",    // the value that means "no filter"
  options: [
    { value: "paid", label: "Paid" },
    { value: "unpaid", label: "Unpaid" },
  ],
}
```

- Do not add `"all"` to `options`. Removing the chip already means "all".
- Long list? A search box shows up in it by itself (more than 8 options). Add `searchable: true` to always show it.
- Options from an API, one page at a time? Add `onSearchChange` and the search box sends you what the user types instead of searching the options itself. Load the matching options and pass them as `options`:

  ```js
  { key: "customer", label: "Customer", defaultValue: "all", options: customers, onSearchChange: setCustomerQuery }
  ```

  It is called on every key press, so wait a little before calling your API. When the list closes, it is called with `""` once more. Set `loading: true` while you load and an empty list says "Loading…" instead of "No results".

  The picked customer may not be on the page you loaded. Give its name as `valueLabel` and the chip shows it instead of the bare value, e.g. `valueLabel: "Ada Yılmaz"`.

  With ids as values, keep the picked customer's name yourself: take it from your options when the user picks one, or ask your API for it when the id comes from the URL:

  ```jsx
  const [customerQuery, setCustomerQuery] = useState("");
  // Your API, e.g. [{ value: "42", label: "Ada Yılmaz" }]. Ids as strings, a URL gives them back as strings
  const { customers, loading } = useCustomerSearch(customerQuery);
  const [picked, setPicked] = useState(null); // { value, label } of the selected customer

  // The id came from the URL (or the back button): ask your API for its name
  useEffect(() => {
    if (values.customer === "all" || picked?.value === values.customer) return;
    getCustomer(values.customer).then((customer) => setPicked({ value: customer.id, label: customer.name }));
  }, [values.customer]);

  function handleChange(changes) {
    // Picked from the list: the name is in your options
    if ("customer" in changes) setPicked(customers.find((customer) => customer.value === changes.customer) ?? null);
    setValues({ ...values, ...changes });
  }

  const filters = [
    {
      key: "customer",
      label: "Customer",
      defaultValue: "all",
      options: customers,
      loading,
      onSearchChange: setCustomerQuery,
      valueLabel: picked?.label,
    },
  ];

  <FilterBar filters={filters} values={values} onChange={handleChange} />
  ```
- Want an icon? Add `icon: SomeIcon`. Any React component works, for example one from `lucide-react`.

### A date range

```js
{ key: "date", label: "Date Range", type: "dateRange", defaultValue: null }
```

The value you get looks like this:

```js
{ preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }
```

- `from` and `to` are days, and both days count. Send them to your API as they are.
- `preset` is the name of the quick pick, or `"custom"` when the user picked days on the calendar.

#### Only a start or only an end day

Add `allowOpenRange: true` and the user can apply a single day:

```js
{ key: "date", label: "Date Range", type: "dateRange", defaultValue: null, allowOpenRange: true }
```

- Only a start day: `{ preset: "custom", from: "2026-10-01", to: null }`, that day and everything after. The chip reads "From 10/01/2026" with `locale="en"`.
- Only an end day: `{ preset: "custom", from: null, to: "2026-10-31" }`, that day and everything before. The chip reads "Until 10/31/2026" with `locale="en"`.
- Clear one of the date inputs to leave that side open.

#### Records without a date

Some dates can be empty, for example "updated" before the first update. Such records never fall in a date range. Add `emptyValues: true` and the panel shows a "Show empty ones too" checkbox with an info icon that explains this:

```js
{ key: "updated", label: "Updated", type: "dateRange", defaultValue: null, emptyValues: true, emptyValuesHint: "Records never updated have no update date." }
```

- When it is checked, the value gets `includeEmpty: true`, e.g. `{ preset: "custom", from: "2026-10-10", to: null, includeEmpty: true }`. The chip reads "From 10/10/2026 + empty" with `locale="en"`.
- Your API decides what it means. Usually: the range, or the date is empty.
- `emptyValuesHint` is optional and replaces the generic text of the info icon.

## The date picker on its own

You can also use the date picker as a separate button, for example on a dashboard:

```jsx
import { DateRangePicker, createPresetRange } from "@turkpin/compact-filters";

const [range, setRange] = useState(() => createPresetRange("last30Days"));

<DateRangePicker value={range} onChange={setRange} />
```

## Change the texts

Every text can be changed with `labels`:

```jsx
<FilterBar labels={{ filter: "Refine", clear: "Reset all" }} />
```

To rename a quick pick, use `presets`:

```jsx
<FilterBar labels={{ presets: { last7Days: "Past week" } }} />
```

All texts are in [`src/labels.js`](src/labels.js).

## Keep the filters in the URL (optional)

With the filters in the URL, users can refresh the page or share a link and see the same list. Two helpers turn a date range into URL values and back:

```js
import { buildDateRangeUrlParams, parseDateRangeParams } from "@turkpin/compact-filters/date-range";

// URL → value: ?range=thisMonth or ?date_from=2026-10-01&date_to=2026-10-15
const date = parseDateRangeParams(searchParams, { defaultPreset: null });

// value → URL: null means "remove it from the URL"
const params = buildDateRangeUrlParams(date, { defaultPreset: null });
// { range: "thisMonth", date_from: null, date_to: null }
```

A shared "This month" link always means the current month, even next month.

`parseDateRangeParams` also reads `?date_from=2026-10-01` or `?date_to=2026-10-31` alone as an open range, so `allowOpenRange` only goes on the filter. Pass `allowOpenRange: false` to ignore a single day.

Give `keys` an `empty` key to keep `includeEmpty` in the URL too, e.g. `keys: { ...DATE_RANGE_PARAM_KEYS, empty: "date_empty" }` → `?date_from=2026-10-10&date_empty=1`.

`@turkpin/compact-filters/date-range` is plain JavaScript. It also works on the server.

## Next.js

Use the components inside a client component (a file that starts with `"use client"`). The date helpers from `/date-range` work everywhere.

## All options

### FilterBar

| Prop | What it does |
|---|---|
| `filters` | The filters the user can pick from |
| `values` | What is picked right now: `{ [key]: value }` |
| `onChange` | Called with what changed: `{ [key]: value }` |
| `search` | Optional search box: `{ key, placeholder }` |
| `locale` | `"tr"` (default) or `"en"` |
| `dateFormat` | How picked days are written: `"locale"` (default, `01.10.2026` in Turkish), `"iso"` (`2026-10-01`) or your own function, `(isoDate) => text` |
| `labels` | Your own texts |
| `className` | Extra CSS classes for the bar |

### A filter

| Field | What it does |
|---|---|
| `key` | Its name in `values` |
| `label` | The text the user sees |
| `defaultValue` | The value that means "no filter" (`"all"`, `null`…) |
| `options` | `[{ value, label }]`, for a list of choices |
| `searchable` | Always show the search box in the list |
| `onSearchChange` | `(query) => {}`, search the options yourself, e.g. on your API. The list shows `options` as they are |
| `loading` | `true` while you load the options, an empty list then says "Loading…" |
| `valueLabel` | The chip text for a value that is not in `options` |
| `type` | `"dateRange"` for a date range |
| `presets` | Which quick picks to show in a date range |
| `allowOpenRange` | Let the user apply only a start or only an end day in a date range |
| `minDate`, `maxDate` | The first and last day the user can pick in a date range. `maxDate` is today by default, `null` means no limit |
| `emptyValues`, `emptyValuesHint` | Offer "Show empty ones too" in a date range, with an optional text for its info icon |
| `icon` | An icon component |

### DateRangePicker

| Prop | What it does |
|---|---|
| `value` | The picked range, or `null` |
| `onChange` | Called when the user clicks "Apply" |
| `clearable` | Show a "Clear" button |
| `resetPreset` | Show a "Reset" button that goes back to this quick pick |
| `presets` | Which quick picks to show |
| `allowCustom` | Let the user pick days on the calendar (default `true`) |
| `allowOpenRange` | Let the user apply only a start or only an end day (default `false`) |
| `minDate`, `maxDate` | The first and last day the user can pick. `maxDate` is today by default, `null` means no limit |
| `align` | Where the popup opens: `"start"`, `"center"` or `"end"` (default) |
| `locale`, `labels`, `dateFormat` | Same as FilterBar |

`DateRangePanel` is the picker without its button, for building your own.

### Quick picks

`allTime`, `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `thisYear`, `lastYear`, `last7Days`, `last14Days`, `last30Days`, `last60Days`, `last90Days`, `last180Days`, `last365Days`.

Weeks start on Monday.

### Date helpers

`createPresetRange`, `resolvePreset`, `isPresetKey`, `parseDateRangeParams`, `buildDateRangeUrlParams`, `countDays`, `addDays`, `addMonths`, `startOfWeek`, `startOfMonth`, `endOfMonth`, `toIsoDate`, `fromIsoDate`, `isIsoDate`, `todayIso`, and the constants `DATE_RANGE_PRESETS`, `ALL_PRESET`, `CUSTOM_PRESET`, `DATE_RANGE_PARAM_KEYS`.

## For maintainers

### Work on it

```sh
npm install
npm test        # builds, then runs the tests
```

The code is in `src/`. `npm run build` makes `dist/` with esbuild.

### Try it in a browser

```sh
npm run demo    # then open demo/index.html
```

The demo is a small invoice list. Add `?locale=tr` or `?theme=dark` to the address to see Turkish or dark mode.

`npm run screenshots` takes the pictures in this README again. It needs Google Chrome.

The same page is the [live demo](https://turkpin.github.io/compact-filters/). [`pages.yml`](.github/workflows/pages.yml) publishes it whenever `main` changes. To turn it on once: repository **Settings → Pages → Source: GitHub Actions**.

### Send changes

1. Fork `turkpin/compact-filters` and work on your fork's `dev` branch.
2. Open a pull request to `turkpin:dev`. The tests run on it.
3. When `dev` is ready, merge it into `main` with a pull request.

### Release a new version

`main` and `dev` only take changes through pull requests, so the version goes in with one too.

1. On your fork's `dev`, raise the version without making a tag:
   ```sh
   npm version patch --no-git-tag-version   # or minor / major
   git commit -am "(chore) package: 0.1.1"
   ```
2. Get it into `main` with pull requests: your `dev` → `turkpin:dev` → `main`.
3. Make a GitHub release on `main`. It creates the tag too:
   ```sh
   gh release create v0.1.1 --repo turkpin/compact-filters --target main --generate-notes
   ```
4. A maintainer approves the **npm** deployment in the Actions tab. GitHub Actions then tests it and publishes it to npm.

The release tag must match the version in `package.json` (`v0.1.1` ↔ `0.1.1`), otherwise publishing stops. The npm token is the `NPM_TOKEN` secret of the **npm** environment.

## License

[MIT](LICENSE)
