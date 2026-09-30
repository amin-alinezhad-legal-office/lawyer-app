import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/office/app-shell";
import { RegisterSW } from "@/components/office/register-sw";
import { getCurrentUser, userCan } from "@/lib/auth";
import { appNav } from "@/lib/office";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: `دفتر | ${site.name}`,
    template: `%s | دفتر ${site.name}`,
  },
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "دفتر علی نژاد",
  },
};

export default async function AppPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/app/login");

  const nav = appNav.filter((item) => {
    if (!item.permission) return true;
    return userCan(user, item.permission);
  });

  return (
    <>
      <RegisterSW />
      <AppShell nav={nav} userName={user.fullName} roleName={user.roleName}>
        {children}
      </AppShell>
    </>
  );
}
