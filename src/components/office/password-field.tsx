"use client";

import { useState } from "react";

type Props = {
  id?: string;
  name?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  placeholder?: string;
  defaultValue?: string;
};

export function PasswordField({
  id = "password",
  name = "password",
  required,
  autoComplete = "current-password",
  className = "",
  placeholder = "••••••••",
  defaultValue,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        dir="ltr"
        className={`${className} !pr-16`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 z-10 flex items-center px-3 text-xs font-bold text-white/70 transition-colors hover:text-white"
        aria-label={visible ? "مخفی کردن رمز" : "نمایش رمز"}
        aria-pressed={visible}
      >
        {visible ? "مخفی" : "نمایش"}
      </button>
    </div>
  );
}
