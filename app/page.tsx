import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
      <div className="rounded-2xl border border-white/70 bg-white/80 p-10 shadow-soft backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">
          HPT Tech
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Design System Workspace</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Bo design tokens va component tai su dung cho website B2B thiet bi van phong.
        </p>
        <Link
          href="/design-system"
          className="mt-8 inline-flex h-11 items-center rounded-md bg-accent-500 px-5 font-semibold text-white transition hover:bg-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2"
        >
          Mo showcase
        </Link>
      </div>
    </main>
  );
}
