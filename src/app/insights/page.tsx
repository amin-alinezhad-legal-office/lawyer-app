import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listNotes } from "@/db/queries";
import { formatPersianDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "مطالب مفید",
  description: "مطالب کوتاه درباره قرارداد، مدارک و حدود مشاوره.",
};

export const revalidate = 60;

export default async function InsightsPage() {
  const items = await listNotes();

  return (
    <>
      <PageHeader
        kicker="مطالب مفید"
        title="چند نکته، پیش از آنکه پرونده شلوغ شود."
        lede="این نوشته‌ها اطلاع‌رسانی عمومی‌اند. برای موضوع مشخص، جای مشاوره را نمی‌گیرند."
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-20">
        {items.map((note) => (
          <article key={note.slug} className="border-t border-line py-10">
            <p className="text-sm font-light text-secondary">{formatPersianDate(note.publishedAt)}</p>
            <h2 className="mt-3 text-2xl font-extrabold leading-10">
              <Link href={`/insights/${note.slug}`}>{note.title}</Link>
            </h2>
            <p className="mt-4 font-light leading-8">{note.excerpt}</p>
          </article>
        ))}
      </div>
    </>
  );
}
