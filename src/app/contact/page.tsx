import type { Metadata } from "next";
import { EmailLink, PhoneLink } from "@/components/contact-links";
import { InquiryForm } from "@/components/inquiry-form";
import { PageHeader } from "@/components/page-header";
import { listFormTopicsForContact } from "@/db/queries";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "تماس",
  description: `درخواست مشاوره و نشانی دفتر ${site.name}.`,
};

export const revalidate = 30;

export default async function ContactPage() {
  const mapQuery = encodeURIComponent(site.address);
  const topics = await listFormTopicsForContact();

  return (
    <>
      <PageHeader
        kicker="تماس"
        title="موضوع را کوتاه بنویسید."
        lede="برای هماهنگی وقت، فرم را بفرستید یا مستقیم تماس بگیرید. شرح طولانی لازم نیست؛ کافی است بدانیم موضوع از کدام جنس است."
      />
      <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-16 md:px-10 md:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="space-y-8 text-sm leading-8">
          <div>
            <p className="font-bold">دفتر</p>
            <p className="mt-2 font-light">{site.address}</p>
            <a
              className="mt-2 inline-block font-bold"
              href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              مسیریابی
            </a>
          </div>
          <div>
            <p className="font-bold">تلفن</p>
            <PhoneLink className="mt-2 block font-light" />
          </div>
          <div>
            <p className="font-bold">ایمیل</p>
            <EmailLink className="mt-2 block font-light" />
          </div>
          <p className="font-light text-secondary">
            ارسال فرم، پذیرش وکالت نیست. بعد از خواندن موضوع، برای وقت هماهنگ می‌شود.
          </p>
        </aside>
        <InquiryForm topics={topics} />
      </div>
    </>
  );
}
