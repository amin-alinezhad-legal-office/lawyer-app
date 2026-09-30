"use client";

import { useActionState } from "react";
import { submitInquiry, type InquiryState } from "@/app/actions";
import { MatterSelect } from "@/components/matter-select";
import type { MatterTopic } from "@/lib/site";

const initialState: InquiryState = { status: "idle" };

export function InquiryForm({ topics }: { topics: MatterTopic[] }) {
  const [state, action, pending] = useActionState(submitInquiry, initialState);

  if (state.status === "success") {
    return (
      <p className="border border-line bg-mist px-6 py-8 text-lg leading-9">
        {state.message ?? "درخواست رسید."}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-7" noValidate>
      <input
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <Field label="نام" name="fullName" error={state.fieldErrors?.fullName}>
        <input id="fullName" name="fullName" required autoComplete="name" className="field" />
      </Field>
      <Field label="موبایل" name="phone" error={state.fieldErrors?.phone}>
        <input
          id="phone"
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          className="field ltr-isolate"
          dir="ltr"
          placeholder="۰۹۱۲ ۲۳۹ ۱۸ ۱۰"
        />
      </Field>
      <Field label="ایمیل، اگر هست" name="email" error={state.fieldErrors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="field ltr-isolate"
          dir="ltr"
          placeholder="info@aminalinezhad.ir"
        />
      </Field>
      <div>
        <span className="mb-2 block text-sm font-bold" id="matter-label">
          موضوع
        </span>
        <MatterSelect topics={topics} name="matter" error={state.fieldErrors?.matter} />
      </div>
      <Field label="شرح کوتاه" name="message" error={state.fieldErrors?.message}>
        <textarea id="message" name="message" required rows={6} className="field resize-y" />
      </Field>
      {state.message ? <p className="text-sm text-navy">{state.message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-navy px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "در حال ثبت" : "ارسال درخواست"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={name}>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm font-light">{error}</span> : null}
    </label>
  );
}
