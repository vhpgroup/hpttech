import type { ReactNode } from "react";

type SubpageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function SubpageHero({ eyebrow, title, description, actions }: SubpageHeroProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-l-4 border-blue-600 px-6 py-7 sm:px-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">{eyebrow}</p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{title}</h1>
            {description ? <p className="mt-3 text-base leading-7 text-slate-600">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
