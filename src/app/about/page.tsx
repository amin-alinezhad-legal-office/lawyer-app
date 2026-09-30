import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getAboutContent } from "@/db/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "درباره",
  description: `معرفی ${site.name}، ${site.role} در ${site.bar}.`,
};

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <>
      <PageHeader kicker={about.kicker} title={about.title} lede={about.lede} />
      <article className="mx-auto w-full max-w-3xl space-y-8 px-6 py-16 text-lg font-light leading-9 md:px-10 md:py-24">
        {about.sections.map((section) => (
          <div key={section.id} className="space-y-8">
            {section.title ? <h2 className="pt-6 text-3xl font-extrabold">{section.title}</h2> : null}
            {section.body.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={`${section.id}-${index}`}>{paragraph.trim()}</p>
            ))}
          </div>
        ))}
        {about.ctaLabel ? (
          <p>
            <Link href={about.ctaHref || "/contact"} className="font-bold">
              {about.ctaLabel}
            </Link>
          </p>
        ) : null}
      </article>
    </>
  );
}
