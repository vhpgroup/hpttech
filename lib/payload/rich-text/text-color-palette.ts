export type TextColorGroupKey = "theme" | "standard";

export type TextColorOption = {
  css: {
    color: string;
  };
  group: TextColorGroupKey;
  key: string;
  label: string;
  swatch: string;
};

export type TextColorPaletteFeatureProps = {
  colors: TextColorOption[];
};

export const textColorOptions: TextColorOption[] = [
  {
    key: "ink",
    label: "Văn bản chính",
    group: "theme",
    swatch: "var(--color-ink)",
    css: { color: "var(--color-ink)" },
  },
  {
    key: "muted",
    label: "Ghi chú",
    group: "theme",
    swatch: "color-mix(in srgb, var(--color-ink) 58%, white)",
    css: { color: "color-mix(in srgb, var(--color-ink) 58%, white)" },
  },
  {
    key: "primary-900",
    label: "Xanh đậm",
    group: "theme",
    swatch: "var(--color-primary-900)",
    css: { color: "var(--color-primary-900)" },
  },
  {
    key: "primary-700",
    label: "Xanh HPT",
    group: "theme",
    swatch: "var(--color-primary-700)",
    css: { color: "var(--color-primary-700)" },
  },
  {
    key: "primary-500",
    label: "Xanh sáng",
    group: "theme",
    swatch: "var(--color-primary-500)",
    css: { color: "var(--color-primary-500)" },
  },
  {
    key: "accent-700",
    label: "Cam đậm",
    group: "theme",
    swatch: "var(--color-accent-700)",
    css: { color: "var(--color-accent-700)" },
  },
  {
    key: "accent-600",
    label: "Cam nhấn",
    group: "theme",
    swatch: "var(--color-accent-600)",
    css: { color: "var(--color-accent-600)" },
  },
  {
    key: "accent-500",
    label: "Cam sáng",
    group: "theme",
    swatch: "var(--color-accent-500)",
    css: { color: "var(--color-accent-500)" },
  },
  {
    key: "success",
    label: "Xanh thành công",
    group: "theme",
    swatch: "var(--color-success)",
    css: { color: "var(--color-success)" },
  },
  {
    key: "warning",
    label: "Vàng cảnh báo",
    group: "theme",
    swatch: "var(--color-warning)",
    css: { color: "var(--color-warning)" },
  },
  {
    key: "danger",
    label: "Đỏ cảnh báo",
    group: "theme",
    swatch: "var(--color-danger)",
    css: { color: "var(--color-danger)" },
  },
  {
    key: "standard-red",
    label: "Đỏ",
    group: "standard",
    swatch: "var(--color-danger)",
    css: { color: "var(--color-danger)" },
  },
  {
    key: "standard-yellow",
    label: "Vàng",
    group: "standard",
    swatch: "var(--color-warning)",
    css: { color: "var(--color-warning)" },
  },
  {
    key: "standard-green",
    label: "Xanh lá",
    group: "standard",
    swatch: "var(--color-success)",
    css: { color: "var(--color-success)" },
  },
  {
    key: "standard-blue",
    label: "Xanh dương",
    group: "standard",
    swatch: "var(--color-primary-700)",
    css: { color: "var(--color-primary-700)" },
  },
  {
    key: "standard-orange",
    label: "Cam",
    group: "standard",
    swatch: "var(--color-accent-600)",
    css: { color: "var(--color-accent-600)" },
  },
];

export const textColorStyleByKey = new Map(
  textColorOptions.map((option) => [option.key, option.css] as const),
);

export const textColorStateValues = Object.fromEntries(
  textColorOptions.map((option) => [
    option.key,
    {
      css: option.css,
      label: option.label,
    },
  ]),
);
