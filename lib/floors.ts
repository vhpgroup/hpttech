import { HPT_DATA, type Product } from "@/lib/data";

export type FloorConfig = {
  id: string;
  title: string;
  href: string;
  products: Product[];
};

const pick = (category: string, limit = 10): Product[] =>
  HPT_DATA.products.filter((product) => product.category === category).slice(0, limit);

export const HOME_FLOORS: FloorConfig[] = [
  {
    id: "may-in",
    title: "Máy in",
    href: "/san-pham?category=Máy%20in",
    products: pick("Máy in"),
  },
  {
    id: "may-scan",
    title: "Máy scan",
    href: "/san-pham?category=Máy%20scan",
    products: pick("Máy scan"),
  },
];
