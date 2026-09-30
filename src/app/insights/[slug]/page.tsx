import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNote, listNotes } from "@/db/queries";
import { formatPersianDate, paragraphs } from "@/lib/format";
import { notes } from "@/lib/notes";

export const revalidate = 60;

export async function generateStaticParams() {
  const items = await listNotes().catch(() => notes);
  return items.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await getNote(slug);
  if (!note) return { title: "مطلب" };
  return { title: note.title, description: note.excerpt };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getNote(slug);
  if (!note) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
      <p className="text-sm font-light text-secondary">
        <Link href="/insights">مطالب مفید</Link>
        <span className="mx-2">/</span>
        {formatPersianDate(note.publishedAt)}
      </p>
      <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">{note.title}</h1>
      <div className="mt-10 space-y-6 text-lg font-light leading-9">
        {paragraphs(note.body).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-12 border-t border-line pt-6 text-sm font-light leading-7 text-secondary">
        این مطلب اطلاع‌رسانی عمومی است و جایگزین مشاوره در یک پرونده مشخص نیست.
      </p>
    </article>
  );
}
