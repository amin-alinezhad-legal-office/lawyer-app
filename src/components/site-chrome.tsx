"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const office = pathname === "/app" || pathname.startsWith("/app/");

  if (office) return <>{children}</>;

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
