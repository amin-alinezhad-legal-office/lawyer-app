import Image from "next/image";
import Link from "next/link";
import { EmailLink, PhoneLink } from "@/components/contact-links";
import { nav, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-10">
        <div>
          <Image
            src="/brand/mark-white.png"
            alt=""
            width={475}
            height={634}
            className="h-auto w-24"
          />
          <p className="mt-6 max-w-xs text-sm font-light leading-7 text-white/75">
            {site.name}، {site.role}. شماره پروانه {site.license}.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <SocialLink href={site.social.instagram} label="اینستاگرام">
              <InstagramIcon />
            </SocialLink>
            <SocialLink href={site.social.linkedin} label="لینکدین">
              <LinkedInIcon />
            </SocialLink>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">صفحات</p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-white/75 transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm leading-7">
          <p className="font-bold">دفتر</p>
          <p className="mt-4 font-light text-white/75">{site.address}</p>
          <PhoneLink className="mt-2 block font-light text-white/75 transition-colors hover:text-white" />
          <EmailLink className="block font-light text-white/75 transition-colors hover:text-white" />
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-5 text-xs font-light text-white/60 md:flex-row md:justify-between md:px-10">
          <p>
            {site.year} · {site.domain}
          </p>
          <p>مطالب این وب‌سایت اطلاع‌رسانی عمومی است و رابطه وکالت ایجاد نمی‌کند.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-[0.4rem] border border-white/20 text-white/80 transition-colors hover:border-white/45 hover:text-white"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M8 10.5V16.5M8 7.8v.2M12 16.5v-3.6c0-1.2.9-2.1 2.1-2.1s2.1.9 2.1 2.1v3.6M12 10.5V16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
