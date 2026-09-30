import { LetterEditor } from "@/components/office/letter-editor";
import { requirePermission } from "@/lib/auth";

export const metadata = { title: "نامه تازه" };

export default async function NewLetterPage() {
  await requirePermission("office.letters.write");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold">نامه تازه</h1>
      <LetterEditor initialTitle="" initialHtml="<p></p>" />
    </div>
  );
}
