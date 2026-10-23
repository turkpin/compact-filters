# @turkpin/compact-filters

[English](https://github.com/turkpin/compact-filters/blob/main/README.md) · **Türkçe**

React listeleri için küçük bir filtre çubuğu. Filtreyi seç, değeri seç, bitti.

**[Canlı demoyu dene →](https://turkpin.github.io/compact-filters/?locale=tr)**

![Bir fatura listesinin üstünde üç filtresi açık filtre çubuğu](screenshots/turkish.png)

- Filtreler sen kullanana kadar gizli durur, çubuk hep küçük kalır.
- Açık olan her filtre bir kutucuktur: değiştirmek için üstüne tıkla, kaldırmak için **×**'e tıkla.
- İçinde bir tarih aralığı seçici var: "Bugün", "Bu ay", "Son 30 gün"… ya da takvimden istediğin iki gün.
- Türkçe ve İngilizce bilir.
- Hafiftir: yaklaşık 15 kB, ikon kütüphanesi gerekmez ve uygulamanın renklerini kullanır.

## Görüntüler

| Filtre seç | Uzun listede ara |
|---|---|
| ![Filtrele menüsü](screenshots/filter-menu.png) | ![Arama kutulu müşteri listesi](screenshots/filter-options.png) |
| **Tarih seç** | **Koyu tema** |
| ![Tarih aralığı seçici](screenshots/date-range.png) | ![Koyu temada filtre çubuğu](screenshots/dark.png) |
| **İngilizce** | **Telefonda** |
| ![İngilizce filtre çubuğu](screenshots/filter-bar.png) | ![Telefonda tarih seçici](screenshots/mobile.png) |

## 1. Kur

```sh
npm install @turkpin/compact-filters
```

Şu paketler de gerekir. Uygulaman [shadcn/ui](https://ui.shadcn.com/) kullanıyorsa büyük ihtimalle zaten kuruludur:

```sh
npm install react react-dom @radix-ui/react-popover @radix-ui/react-dropdown-menu tailwind-merge
```

## 2. Tailwind'e göster

Filtre çubuğunun görünüşü [Tailwind CSS v4](https://tailwindcss.com/) ile yapılır. Tailwind'in onu bulması için ana CSS dosyana bir satır ekle:

```css
@import "tailwindcss";
@source "../node_modules/@turkpin/compact-filters/dist";
```

Yol, CSS dosyanın olduğu yerden başlar. CSS dosyan daha içerideyse `../` kısmını ona göre düzelt.

## 3. Kullan

```jsx
"use client";

import { useState } from "react";
import { FilterBar } from "@turkpin/compact-filters";

const filters = [
  {
    key: "status",
    label: "Durum",
    defaultValue: "all",
    options: [
      { value: "paid", label: "Ödendi" },
      { value: "unpaid", label: "Ödenmedi" },
    ],
  },
  {
    key: "date",
    label: "Tarih Aralığı",
    type: "dateRange",
    defaultValue: null,
  },
];

export function Faturalar() {
  const [values, setValues] = useState({ status: "all", date: null, q: "" });

  return (
    <FilterBar
      filters={filters}
      values={values}
      onChange={(changes) => setValues({ ...values, ...changes })}
      search={{ key: "q", placeholder: "Fatura ara" }}
    />
  );
}
```

Hepsi bu. Her parça ne işe yarar:

- **`filters`**, kullanıcının seçebileceği filtrelerin listesidir.
- **`values`**, şu an neyin seçili olduğunu tutar.
- **`onChange`**, neyin değiştiğini söyler, örneğin `{ status: "paid" }`. Bunu state'ine koy, sonra listeni yeni değerlerle yükle.
- **`search`**, bir arama kutusu ekler. Gerekmiyorsa yazma.
- **`locale`**, `"tr"` (varsayılan) ya da `"en"` olur.

## İki çeşit filtre

### Seçenek listesi

```js
{
  key: "status",          // values içindeki adı
  label: "Durum",         // kullanıcının gördüğü yazı
  defaultValue: "all",    // "filtre yok" anlamına gelen değer
  options: [
    { value: "paid", label: "Ödendi" },
    { value: "unpaid", label: "Ödenmedi" },
  ],
}
```

- `"all"`'u `options` içine koyma. Kutucuğu kaldırmak zaten "hepsi" demek.
- Liste uzun mu? İçinde kendiliğinden bir arama kutusu çıkar (8'den fazla seçenekte). Hep görünsün istersen `searchable: true` ekle.
- Seçenekler bir API'den sayfa sayfa mı geliyor? `onSearchChange` ekle, arama kutusu seçeneklerde kendisi aramak yerine yazılanı sana gönderir. Uyan seçenekleri yükle ve `options` olarak ver:

  ```js
  { key: "customer", label: "Müşteri", defaultValue: "all", options: customers, onSearchChange: setCustomerQuery }
  ```

  Her tuşta çağrılır, API'ye gitmeden önce biraz bekle. Liste kapanınca bir kez de `""` ile çağrılır.

  Seçili müşteri yüklediğin sayfada olmayabilir. Adını `valueLabel` olarak ver, kutucuk çıplak değer yerine onu gösterir, örneğin `valueLabel: "Ada Yılmaz"`.
- İkon mu istiyorsun? `icon: BirIkon` ekle. Herhangi bir React component'i olur, örneğin `lucide-react`'ten biri.

### Tarih aralığı

```js
{ key: "date", label: "Tarih Aralığı", type: "dateRange", defaultValue: null }
```

Gelen değer şöyle görünür:

```js
{ preset: "thisMonth", from: "2026-10-01", to: "2026-10-15" }
```

- `from` ve `to` gündür ve iki gün de dahildir. API'ne olduğu gibi gönder.
- `preset`, hızlı seçimin adıdır. Kullanıcı takvimden gün seçtiyse `"custom"` olur.

#### Yalnızca başlangıç ya da yalnızca bitiş günü

`allowOpenRange: true` eklersen kullanıcı tek bir günle de uygulayabilir:

```js
{ key: "date", label: "Tarih Aralığı", type: "dateRange", defaultValue: null, allowOpenRange: true }
```

- Yalnızca başlangıç günü: `{ preset: "custom", from: "2026-10-01", to: null }`, o gün ve sonrası. Chip'te "01.10.2026 ve sonrası" yazar.
- Yalnızca bitiş günü: `{ preset: "custom", from: null, to: "2026-10-31" }`, o gün ve öncesi. Chip'te "31.10.2026 ve öncesi" yazar.
- Bir tarafı açık bırakmak için o tarih kutusunu temizle.

#### Tarihi boş olan kayıtlar

Bazı tarihler boş olabilir, örneğin ilk güncellemeden önce "güncellenme". Bu kayıtlar hiçbir tarih aralığına girmez. `emptyValues: true` eklersen panelde "Boş olanları da göster" kutusu ve bunu anlatan bir bilgi ikonu görünür:

```js
{ key: "updated", label: "Güncellenme", type: "dateRange", defaultValue: null, emptyValues: true, emptyValuesHint: "Hiç güncellenmemiş kayıtların güncellenme tarihi yoktur." }
```

- Kutu işaretliyse değere `includeEmpty: true` eklenir, ör. `{ preset: "custom", from: "2026-10-10", to: null, includeEmpty: true }`. Chip'te "10.10.2026 ve sonrası + boşlar" yazar.
- Ne anlama geldiğine API'n karar verir. Genelde: aralık ya da tarih boş.
- `emptyValuesHint` isteğe bağlıdır, bilgi ikonundaki genel metnin yerine geçer.

## Tarih seçiciyi tek başına kullan

Tarih seçiciyi ayrı bir buton olarak da kullanabilirsin, örneğin bir dashboard'da:

```jsx
import { DateRangePicker, createPresetRange } from "@turkpin/compact-filters";

const [range, setRange] = useState(() => createPresetRange("last30Days"));

<DateRangePicker value={range} onChange={setRange} />
```

## Yazıları değiştir

Her yazı `labels` ile değiştirilebilir:

```jsx
<FilterBar labels={{ filter: "Süz", clear: "Hepsini sıfırla" }} />
```

Bir hızlı seçimin adını değiştirmek için `presets` kullan:

```jsx
<FilterBar labels={{ presets: { last7Days: "Geçen 1 hafta" } }} />
```

Bütün yazılar [`src/labels.js`](../src/labels.js) dosyasında.

## Filtreleri adres çubuğunda tut (isteğe bağlı)

Filtreler adresteyse kullanıcı sayfayı yenilediğinde ya da linki paylaştığında aynı listeyi görür. İki yardımcı, tarih aralığını adres değerlerine çevirir ve geri alır:

```js
import { buildDateRangeUrlParams, parseDateRangeParams } from "@turkpin/compact-filters/date-range";

// adres → değer: ?range=thisMonth ya da ?date_from=2026-10-01&date_to=2026-10-15
const date = parseDateRangeParams(searchParams, { defaultPreset: null });

// değer → adres: null "adresten kaldır" demek
const params = buildDateRangeUrlParams(date, { defaultPreset: null });
// { range: "thisMonth", date_from: null, date_to: null }
```

Paylaşılan bir "Bu ay" linki hep içinde bulunulan ayı gösterir, gelecek ay açılsa bile.

`parseDateRangeParams` tek başına gelen `?date_from=2026-10-01` ya da `?date_to=2026-10-31` değerini de açık aralık olarak okur; yani `allowOpenRange` yalnızca filtreye yazılır. Tek günü yok saymak için `allowOpenRange: false` ver.

`includeEmpty`'yi URL'de de tutmak için `keys`'e bir `empty` anahtarı ver, ör. `keys: { ...DATE_RANGE_PARAM_KEYS, empty: "date_empty" }` → `?date_from=2026-10-10&date_empty=1`.

`@turkpin/compact-filters/date-range` düz JavaScript'tir. Sunucuda da çalışır.

## Next.js

Component'leri bir client component içinde kullan (`"use client"` ile başlayan bir dosya). `/date-range` yardımcıları her yerde çalışır.

## Bütün seçenekler

### FilterBar

| Prop | Ne yapar |
|---|---|
| `filters` | Kullanıcının seçebileceği filtreler |
| `values` | Şu an seçili olanlar: `{ [key]: value }` |
| `onChange` | Değişenle çağrılır: `{ [key]: value }` |
| `search` | İsteğe bağlı arama kutusu: `{ key, placeholder }` |
| `locale` | `"tr"` (varsayılan) ya da `"en"` |
| `dateFormat` | Seçilen günlerin yazılışı: `"locale"` (varsayılan, Türkçede `01.10.2026`), `"iso"` (`2026-10-01`) ya da kendi fonksiyonunuz, `(isoDate) => metin` |
| `labels` | Kendi yazıların |
| `className` | Çubuğa eklenecek CSS class'ları |

### Bir filtre

| Alan | Ne yapar |
|---|---|
| `key` | `values` içindeki adı |
| `label` | Kullanıcının gördüğü yazı |
| `defaultValue` | "Filtre yok" anlamına gelen değer (`"all"`, `null`…) |
| `options` | `[{ value, label }]`, seçenek listesi için |
| `searchable` | Listedeki arama kutusunu hep göster |
| `onSearchChange` | `(query) => {}`, seçeneklerde sen ara, örneğin API'nde. Liste `options`'ı olduğu gibi gösterir |
| `valueLabel` | `options` içinde olmayan bir değer için kutucuk yazısı |
| `type` | Tarih aralığı için `"dateRange"` |
| `presets` | Tarih aralığında hangi hızlı seçimler görünsün |
| `allowOpenRange` | Tarih aralığında yalnızca başlangıç ya da yalnızca bitiş günüyle uygulanabilsin |
| `minDate`, `maxDate` | Tarih aralığında seçilebilecek ilk ve son gün. `maxDate` varsayılan olarak bugündür, `null` sınır yok demek |
| `emptyValues`, `emptyValuesHint` | Tarih aralığında "Boş olanları da göster" seçeneği, bilgi ikonu için isteğe bağlı bir metinle |
| `icon` | Bir ikon component'i |

### DateRangePicker

| Prop | Ne yapar |
|---|---|
| `value` | Seçili aralık ya da `null` |
| `onChange` | Kullanıcı "Uygula"ya tıklayınca çağrılır |
| `clearable` | "Temizle" butonu göster |
| `resetPreset` | Bu hızlı seçime dönen bir "Sıfırla" butonu göster |
| `presets` | Hangi hızlı seçimler görünsün |
| `allowCustom` | Kullanıcı takvimden gün seçebilsin (varsayılan `true`) |
| `allowOpenRange` | Yalnızca başlangıç ya da yalnızca bitiş günüyle uygulanabilsin (varsayılan `false`) |
| `minDate`, `maxDate` | Seçilebilecek ilk ve son gün. `maxDate` varsayılan olarak bugündür, `null` sınır yok demek |
| `align` | Pencerenin açılacağı yer: `"start"`, `"center"` ya da `"end"` (varsayılan) |
| `locale`, `labels`, `dateFormat` | FilterBar'daki gibi |

`DateRangePanel`, butonu olmayan seçicidir; kendi butonunu yapmak için.

### Hızlı seçimler

`allTime`, `today`, `yesterday`, `thisWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `thisYear`, `lastYear`, `last7Days`, `last14Days`, `last30Days`, `last60Days`, `last90Days`, `last180Days`, `last365Days`.

Haftalar pazartesi başlar.

### Tarih yardımcıları

`createPresetRange`, `resolvePreset`, `isPresetKey`, `parseDateRangeParams`, `buildDateRangeUrlParams`, `countDays`, `addDays`, `addMonths`, `startOfWeek`, `startOfMonth`, `endOfMonth`, `toIsoDate`, `fromIsoDate`, `isIsoDate`, `todayIso` ve sabitler: `DATE_RANGE_PRESETS`, `ALL_PRESET`, `CUSTOM_PRESET`, `DATE_RANGE_PARAM_KEYS`.

## Geliştirenler için

### Üzerinde çalış

```sh
npm install
npm test        # build alır, sonra testleri çalıştırır
```

Kod `src/` içinde. `npm run build`, esbuild ile `dist/` klasörünü oluşturur.

### Tarayıcıda dene

```sh
npm run demo    # sonra demo/index.html dosyasını aç
```

Demo küçük bir fatura listesi. Türkçe ya da koyu temayı görmek için adresin sonuna `?locale=tr` ya da `?theme=dark` ekle.

`npm run screenshots`, bu README'deki görüntüleri yeniden çeker. Google Chrome gerekir.

Aynı sayfa [canlı demo](https://turkpin.github.io/compact-filters/?locale=tr) olarak yayında. [`pages.yml`](../.github/workflows/pages.yml) her `main` değişikliğinde onu yayınlar. Bir kez açmak için: repo **Settings → Pages → Source: GitHub Actions**.

### Değişiklik gönder

1. `turkpin/compact-filters` reposunu fork'la, fork'unun `dev` branch'inde çalış.
2. `turkpin:dev`'e bir pull request aç. Testler üzerinde çalışır.
3. `dev` hazır olunca bir pull request ile `main`'e birleştir.

### Yeni sürüm çıkar

`main` ve `dev` yalnızca pull request ile değişiklik alır, bu yüzden sürüm de bir PR ile girer.

1. Fork'unun `dev` branch'inde sürümü tag oluşturmadan artır:
   ```sh
   npm version patch --no-git-tag-version   # ya da minor / major
   git commit -am "(chore) package: 0.1.1"
   ```
2. Pull request'lerle `main`'e taşı: kendi `dev`'in → `turkpin:dev` → `main`.
3. `main` üzerinde bir GitHub release oluştur. Tag'i de o oluşturur:
   ```sh
   gh release create v0.1.1 --repo turkpin/compact-filters --target main --generate-notes
   ```
4. Bir yönetici Actions sekmesinde **npm** yayınını onaylar. GitHub Actions test eder ve npm'e yayınlar.

Release tag'i `package.json`'daki sürümle aynı olmalı (`v0.1.1` ↔ `0.1.1`), yoksa yayın durur. npm token'ı **npm** ortamının `NPM_TOKEN` secret'ıdır.

## Lisans

[MIT](../LICENSE)
