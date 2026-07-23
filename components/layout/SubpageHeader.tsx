import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type SubpageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  cta?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
};

export function SubpageBreadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav className={cn("flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500", className)} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link href={item.href} className="transition hover:text-primary-600">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-slate-500" : undefined}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight size={13} className="text-slate-300" /> : null}
          </span>
        );
      })}
    </nav>
  );
}

export function SubpageHeader({
  title,
  breadcrumbs,
  className,
}: SubpageHeaderProps) {
  const items = breadcrumbs?.length
    ? breadcrumbs
    : [
        { label: "Trang chủ", href: "/" },
        { label: title },
      ];

  return (
    <header className={cn("mb-4", className)}>
      <SubpageBreadcrumb items={items} />
    </header>
  );
}
