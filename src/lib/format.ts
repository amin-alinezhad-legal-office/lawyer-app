const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

export function toEnglishDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const persian = persianDigits.indexOf(char);
    if (persian >= 0) return String(persian);
    return String(arabicDigits.indexOf(char));
  });
}

export function normalizePhone(value: string) {
  const digits = toEnglishDigits(value).replace(/[^\d]/g, "");
  if (digits.startsWith("0098") && digits.length === 14) return `0${digits.slice(4)}`;
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  return digits;
}

export function formatPersianDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
