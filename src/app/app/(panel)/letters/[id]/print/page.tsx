import Link from "next/link";
import { notFound } from "next/navigation";
import { LetterSheet } from "@/components/office/letter-sheet";
import { PrintButton } from "@/components/office/print-button";
import { getLetter } from "@/db/queries";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LetterPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("office.letters.read");
  const { id } = await params;
  const row = await getLetter(id).catch(() => null);
  if (!row) notFound();

  return (
    <div className="min-h-dvh bg-mist px-4 py-8 md:px-8">
      <div className="mb-6 flex flex-wrap gap-3 print:hidden">
        <PrintButton />
        <Link href={`/app/letters/${row.id}`} className="btn border border-line bg-white px-4 py-3 text-sm font-bold">
          بازگشت به ویرایش
        </Link>
      </div>
      <LetterSheet title={row.title} bodyHtml={row.bodyHtml} showHeader={row.showHeader} />
    </div>
  );
}
