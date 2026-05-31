import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="subpage-breadcrumb" aria-label="Breadcrumb">
      <Link href="/" aria-label="Trang chủ">
        <Home size={15} />
      </Link>
      {items.map((item) => (
        <span className="subpage-breadcrumb-item" key={`${item.href || "current"}-${item.label}`}>
          <ChevronRight size={14} aria-hidden="true" />
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
