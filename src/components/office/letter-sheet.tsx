import Image from "next/image";
import { site } from "@/lib/site";

export function LetterSheet({
  title,
  bodyHtml,
  showHeader,
}: {
  title: string;
  bodyHtml: string;
  showHeader: boolean;
}) {
  return (
    <article className="letter-sheet mx-auto max-w-[210mm] bg-white text-navy">
      {showHeader ? (
        <header className="mb-10 flex items-start justify-between gap-6 border-b border-navy/20 pb-6">
          <div>
            <p className="text-xl font-extrabold">{site.name}</p>
            <p className="mt-2 text-sm font-light">{site.role}</p>
            <p className="mt-1 text-sm font-light">{site.bar}</p>
            <p className="mt-4 text-xs font-light leading-6 text-secondary">{site.address}</p>
            <p className="ltr-isolate mt-2 text-xs font-light" dir="ltr">
              {site.phoneDisplay} · {site.email}
            </p>
          </div>
          <Image
            src="/brand/mark-navy.png"
            alt=""
            width={475}
            height={634}
            className="h-auto w-24"
          />
        </header>
      ) : null}
      <h1 className="mb-8 text-2xl font-extrabold">{title}</h1>
      <div
        className="letter-body text-base font-light leading-9 [&_p]:mb-4 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </article>
  );
}
