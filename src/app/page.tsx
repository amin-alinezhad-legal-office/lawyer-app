import Link from "next/link";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { listNotes, listFormTopicsForSite } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";
import { site } from "@/lib/site";

export const revalidate = 30;

export default async function HomePage() {
  const latestNotes = (await listNotes()).slice(0, 3);
  const matters = await listFormTopicsForSite();
  const persianIndex = ["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶", "۰۷", "۰۸", "۰۹", "۱۰"];

  return (
    <>
      <Hero />

      <section className="border-b border-line bg-mist">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 md:px-10 md:py-28">
          <Reveal>
            <div data-reveal className="flex items-end justify-between gap-6">
              <h2 className="text-3xl font-extrabold md:text-5xl">حوزه‌های کاری</h2>
              <Link href="/practice" className="text-sm font-bold">
                شرح بیشتر
              </Link>
            </div>
            <div className="mt-10">
              {matters.map((matter, index) => (
                <Link
                  data-reveal
                  key={matter.slug}
                  href={`/practice#${matter.slug}`}
                  className="grid gap-3 border-t border-line py-8 md:grid-cols-[5rem_14rem_1fr] md:items-baseline"
                >
                  <span className="text-sm font-light text-secondary">
                    {persianIndex[index] ?? String(index + 1)}
                  </span>
                  <span className="text-2xl font-extrabold">{matter.title}</span>
                  <span className="font-light leading-8">{matter.summary}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <p className="text-sm font-light text-white/70">جمله کار</p>
          <blockquote className="mt-6 max-w-4xl text-4xl font-extrabold leading-snug md:text-6xl">
            {site.motto}
          </blockquote>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <div data-reveal className="flex items-end justify-between gap-6">
            <h2 className="text-3xl font-extrabold md:text-5xl">مطالب مفید</h2>
            <Link href="/insights" className="text-sm font-bold">
              همه
            </Link>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {latestNotes.map((note) => (
              <article data-reveal key={note.slug} className="border-t border-line pt-6">
                <p className="text-sm font-light text-secondary">{formatPersianDate(note.publishedAt)}</p>
                <h3 className="mt-4 text-xl font-bold leading-8">
                  <Link href={`/insights/${note.slug}`}>{note.title}</Link>
                </h3>
                <p className="mt-3 font-light leading-8">{note.excerpt}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>
    </>
  );
}
