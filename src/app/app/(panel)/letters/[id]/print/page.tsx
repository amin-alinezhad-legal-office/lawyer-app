import { notFound } from "next/navigation";
import { LetterPrintStudio } from "@/components/office/letter-print-studio";
import { getLetter } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "چاپ نامه" };

export default async function LetterPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("office.letters.read");
  const { id } = await params;
  const row = await getLetter(id).catch(() => null);
  if (!row) notFound();

  return (
    <LetterPrintStudio letterId={row.id} title={row.title} bodyHtml={row.bodyHtml} />
  );
}
