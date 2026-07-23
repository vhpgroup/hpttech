import Link from "next/link";
import { helpLinks, type HelpPath } from "@/lib/help-links";

export default function HelpSidebar({ activePath }: { activePath: HelpPath }) {
  return (
    <aside className="border border-slate-300 bg-white lg:sticky lg:top-4">
      <h2 className="bg-primary-500 px-4 py-3 text-lg font-bold text-white">Thông Tin Chung</h2>
      <nav aria-label="Trang trợ giúp">
        <ul className="grid sm:grid-cols-2 lg:block">
          {helpLinks.map((link) => {
            const active = link.href === activePath;

            return (
              <li key={link.href} className="border-b border-slate-100 last:border-b-0">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`block px-4 py-3 text-[15px] leading-6 transition ${
                    active
                      ? "bg-primary-50 font-semibold text-primary-700"
                      : "text-slate-800 hover:bg-primary-50 hover:text-primary-700"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
