"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createInquiry, listFormTopicsForContact } from "@/db/queries";
import { normalizePhone } from "@/lib/format";

const inquiryBaseSchema = z.object({
  fullName: z.string().trim().min(2, "نام را کامل‌تر بنویسید.").max(80),
  phone: z.string().refine((value) => /^09\d{9}$/.test(normalizePhone(value)), {
    message: "شماره موبایل را با ۰۹ بنویسید.",
  }),
  email: z
    .string()
    .trim()
    .email("ایمیل درست نیست.")
    .or(z.literal(""))
    .optional(),
  matter: z.string().trim().min(1, "موضوع را انتخاب کنید."),
  message: z.string().trim().min(12, "شرح کوتاه موضوع لازم است.").max(2000),
});

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"fullName" | "phone" | "email" | "matter" | "message", string>>;
};

export async function submitInquiry(
  _previous: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  if (String(formData.get("company") ?? "").trim()) {
    return { status: "success" };
  }

  const parsed = inquiryBaseSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    matter: formData.get("matter"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const fieldErrors: InquiryState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
        fieldErrors[key as keyof typeof fieldErrors] = issue.message;
      }
    }
    return { status: "error", message: "فرم را یک‌بار دیگر ببینید.", fieldErrors };
  }

  const topics = await listFormTopicsForContact();
  if (!topics.some((topic) => topic.slug === parsed.data.matter)) {
    return {
      status: "error",
      message: "فرم را یک‌بار دیگر ببینید.",
      fieldErrors: { matter: "موضوع را انتخاب کنید." },
    };
  }

  try {
    await createInquiry({
      fullName: parsed.data.fullName,
      phone: normalizePhone(parsed.data.phone),
      email: parsed.data.email ? parsed.data.email : null,
      matter: parsed.data.matter,
      message: parsed.data.message,
    });
  } catch {
    return {
      status: "error",
      message: "ثبت درخواست الان ممکن نیست. لطفاً تلفنی هماهنگ کنید.",
    };
  }

  revalidatePath("/app");
  revalidatePath("/app/requests");
  return {
    status: "success",
    message: "درخواست رسید. برای هماهنگی وقت، با شما تماس گرفته می‌شود.",
  };
}

export async function isStudioAuthed() {
  const { isAppAuthed } = await import("@/lib/auth");
  return isAppAuthed();
}

export async function loginStudio(formData: FormData) {
  const { loginApp } = await import("@/app/app/actions");
  await loginApp(formData);
}

export async function logoutStudio() {
  const { logoutApp } = await import("@/app/app/actions");
  await logoutApp();
}
