/**
 * Built-in UI texts. Components take `locale` ("tr" | "en") and optional `labels`
 * overrides, e.g. labels={{ apply: "Tamam", presets: { today: "Bugün" } }}.
 */
export const DEFAULT_LABELS = {
  tr: {
    filter: "Filtrele",
    clear: "Temizle",
    search: "Ara",
    select: "Seçiniz",
    removeFilter: "Filtreyi kaldır",
    searchOptions: "Seçeneklerde ara",
    noResults: "Sonuç bulunamadı",
    loading: "Yükleniyor…",
    dateRange: "Tarih Aralığı",
    custom: "Özel",
    previousMonth: "Önceki ay",
    nextMonth: "Sonraki ay",
    startDate: "Başlangıç Tarihi",
    endDate: "Bitiş Tarihi",
    dayCount: "{count} gün",
    since: "{date} ve sonrası",
    until: "{date} ve öncesi",
    includeEmpty: "Boş olanları da göster",
    includeEmptyHint: "Bu tarihi boş olan kayıtlar (ör. hiç güncellenmemiş) tarih aralığına girmez. İşaretlersen onlar da listelenir.",
    includeEmptyInfo: "Boş tarihler hakkında",
    emptyIncluded: "+ boşlar",
    reset: "Sıfırla",
    cancel: "İptal",
    apply: "Uygula",
    presets: {
      allTime: "Tümü",
      today: "Bugün",
      yesterday: "Dün",
      thisWeek: "Bu hafta",
      lastWeek: "Geçen hafta",
      thisMonth: "Bu ay",
      lastMonth: "Geçen ay",
      thisYear: "Bu yıl",
      lastYear: "Geçen yıl",
      last7Days: "Son 7 gün",
      last14Days: "Son 14 gün",
      last30Days: "Son 30 gün",
      last60Days: "Son 60 gün",
      last90Days: "Son 90 gün",
      last180Days: "Son 180 gün",
      last365Days: "Son 365 gün",
    },
  },
  en: {
    filter: "Filter",
    clear: "Clear",
    search: "Search",
    select: "Select",
    removeFilter: "Remove filter",
    searchOptions: "Search options",
    noResults: "No results",
    loading: "Loading…",
    dateRange: "Date Range",
    custom: "Custom",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    startDate: "Start Date",
    endDate: "End Date",
    dayCount: "{count} days",
    since: "From {date}",
    until: "Until {date}",
    includeEmpty: "Show empty ones too",
    includeEmptyHint: "Records without this date (e.g. never updated) never fall in a date range. Check this to list them too.",
    includeEmptyInfo: "About empty dates",
    emptyIncluded: "+ empty",
    reset: "Reset",
    cancel: "Cancel",
    apply: "Apply",
    presets: {
      allTime: "All",
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This week",
      lastWeek: "Last week",
      thisMonth: "This month",
      lastMonth: "Last month",
      thisYear: "This year",
      lastYear: "Last year",
      last7Days: "Last 7 days",
      last14Days: "Last 14 days",
      last30Days: "Last 30 days",
      last60Days: "Last 60 days",
      last90Days: "Last 90 days",
      last180Days: "Last 180 days",
      last365Days: "Last 365 days",
    },
  },
};

export function resolveLabels(locale = "tr", overrides = null) {
  const base = DEFAULT_LABELS[locale] ?? DEFAULT_LABELS.tr;
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    presets: { ...base.presets, ...overrides.presets },
  };
}

export function formatLabel(text, params = {}) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in params ? String(params[key]) : match));
}

export function getPresetLabel(labels, preset) {
  return labels.presets[preset.key] ?? preset.label ?? preset.key;
}
