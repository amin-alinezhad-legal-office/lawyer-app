import { site } from "@/lib/site";

export function PhoneLink({ className = "" }: { className?: string }) {
  return (
    <a href={`tel:${site.phoneTel}`} className={`ltr-isolate ${className}`} dir="ltr">
      {site.phoneDisplay}
    </a>
  );
}

export function EmailLink({ className = "" }: { className?: string }) {
  return (
    <a href={`mailto:${site.email}`} className={`ltr-isolate ${className}`} dir="ltr">
      {site.email}
    </a>
  );
}
