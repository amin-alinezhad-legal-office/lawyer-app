import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { listFormTopicsForSite } from "@/db/queries";

export const metadata: Metadata = {
  title: "حوزه‌های کاری",
  description: "حوزه‌های کاری پذیرش و شرح کار.",
};

export const revalidate = 30;

export default async function PracticePage() {
  const topics = await listFormTopicsForSite();

  return (
    <>
      <PageHeader
        kicker="حوزه‌های کاری"
        title="حوزه‌ها، با مرز روشن."
        lede="حوزه‌های فعال پذیرش از فرم تماس اینجا هم دیده می‌شوند. خارج از این فهرست، موضوع قبول نمی‌شود یا همان ابتدا گفته می‌شود که جای دیگری مناسب‌تر است."
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
        {topics.map((matter) => (
          <section key={matter.slug} id={matter.slug} className="scroll-mt-28 border-t border-line py-12">
            <h2 className="text-3xl font-extrabold">{matter.title}</h2>
            <p className="mt-6 text-lg font-light leading-9">{matter.body || matter.summary}</p>
          </section>
        ))}
        <p className="border-t border-line pt-10 text-sm font-light leading-7 text-secondary">
          شرح بالا معرفی نوع کار است، نه پذیرش همه پرونده‌های این عناوین.{" "}
          <Link href="/contact" className="font-bold text-navy">
            موضوع را بنویسید
          </Link>{" "}
          تا معلوم شود این دفتر جای آن هست یا نه.
        </p>
      </div>
    </>
  );
}
