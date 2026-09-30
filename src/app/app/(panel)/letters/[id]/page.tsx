import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterEditor } from "@/components/office/letter-editor";
import { getLetter } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getLetter(id).catch(() => null);
  return { title: row?.title ?? "نامه" };
}

export default async function LetterEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("office.letters.read");
  const { id } = await params;
  const row = await getLetter(id).catch(() => null);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <Link href="/app/letters" className="text-sm font-light text-secondary">
        نامه‌ها
      </Link>
      <h1 className="text-3xl font-extrabold">ویرایش نامه</h1>
      <LetterEditor id={row.id} initialTitle={row.title} initialHtml={row.bodyHtml} />
    </div>
  );
}
