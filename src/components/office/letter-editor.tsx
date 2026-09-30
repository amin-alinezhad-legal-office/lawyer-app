"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { saveLetterAction } from "@/app/app/actions";

export function LetterEditor({
  id,
  initialTitle,
  initialHtml,
}: {
  id?: string;
  initialTitle: string;
  initialHtml: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "متن نامه را اینجا بنویسید…" }),
    ],
    content: initialHtml || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[28rem] px-5 py-6 text-base font-light leading-9 outline-none [&_h1]:text-3xl [&_h1]:font-extrabold [&_h2]:text-2xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pr-6 [&_ol]:list-decimal [&_ol]:pr-6",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml || "<p></p>");
  }, [editor, initialHtml]);

  function save() {
    if (!editor) return;
    startTransition(async () => {
      try {
        const result = await saveLetterAction({
          id,
          title: title.trim() || "بدون عنوان",
          bodyHtml: editor.getHTML(),
          showHeader: true,
        });
        setMessage("ذخیره شد.");
        if (!id) router.replace(`/app/letters/${result.id}`);
        else router.refresh();
      } catch {
        setMessage("ذخیره ممکن نشد.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-sm font-bold">عنوان</span>
        <input
          className="field"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="عنوان نامه"
        />
      </label>

      <div className="flex flex-wrap gap-2 border border-line bg-white p-2 print:hidden">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")}>
          ضخیم
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
        >
          کج
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive("underline")}
        >
          زیرخط
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
        >
          فهرست
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          active={editor?.isActive({ textAlign: "right" })}
        >
          راست
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          active={editor?.isActive({ textAlign: "center" })}
        >
          وسط
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
          active={editor?.isActive({ textAlign: "justify" })}
        >
          دوطرفه
        </ToolbarButton>
      </div>

      <div className="border border-line bg-white">
        <EditorContent editor={editor} />
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {pending ? "در حال ذخیره" : "ذخیره نامه"}
        </button>
        {id ? (
          <a
            href={`/app/letters/${id}/print`}
            target="_blank"
            rel="noreferrer"
            className="btn border border-line px-5 py-3 text-sm font-bold"
          >
            پیش‌نمایش چاپ
          </a>
        ) : null}
        {message ? <span className="text-sm font-light">{message}</span> : null}
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs font-bold ${active ? "bg-navy text-white" : "bg-mist text-navy"}`}
    >
      {children}
    </button>
  );
}
