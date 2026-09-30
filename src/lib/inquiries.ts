export const inquiryStatuses = [
  { value: "new", label: "جدید" },
  { value: "open", label: "در حال پیگیری" },
  { value: "no_answer", label: "عدم پاسخ" },
  { value: "junk", label: "هرز" },
  { value: "closed", label: "بسته‌شده" },
  { value: "callback", label: "پیگیری لازم" },
  { value: "appointment", label: "وقت ملاقات" },
  { value: "archived", label: "بایگانی" },
] as const;

export function inquiryStatusLabel(status: string) {
  return inquiryStatuses.find((item) => item.value === status)?.label ?? status;
}
