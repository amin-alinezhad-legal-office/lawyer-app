export const site = {
  name: "محمد امین علی نژاد قادی",
  role: "کارآموز وکالت",
  bar: "کانون وکلای دادگستری مرکز",
  license: "۴۳۵۷۸",
  motto: "وکالت، امانتی است در دستان ما",
  domain: "aminalinezhad.ir",
  url: "https://aminalinezhad.ir",
  email: "info@aminalinezhad.ir",
  phoneDisplay: "۰۹۱۲ ۲۳۹ ۱۸ ۱۰",
  phoneTel: "+989122391810",
  address: "تهران، الهیه، خیابان آقابزرگی، نبش بن‌بست بیژن، پلاک ۱، طبقه ۴",
  year: "۱۴۰۵",
  summary:
    "خدمات حقوقی و مشاوره در امور مدنی، قراردادها و دعاوی، با تعهد به امانت‌داری، دقت و پیگیری.",
  social: {
    instagram: "https://www.instagram.com/aminalinezhad",
    linkedin: "https://www.linkedin.com/in/aminalinezhad",
  },
} as const;

/** Site engineer — kept in code/metadata, not shown in the public UI. */
export const siteCredit = {
  designer: "Amir N. Samimi",
  github: "https://github.com/amirnsamimi",
  role: "Designer & Developer",
} as const;

export const nav = [
  { href: "/", label: "خانه" },
  { href: "/about", label: "درباره" },
  { href: "/practice", label: "حوزه‌های کاری" },
  { href: "/insights", label: "مطالب مفید" },
  { href: "/contact", label: "تماس" },
] as const;

export const matters = [
  {
    slug: "civil",
    title: "امور مدنی",
    summary: "مطالبه حق و دفاع در اختلاف اشخاص، از روی سند و ترتیب وقایع.",
    body: "کار مدنی با خواندن قرارداد، رسید، مکاتبه و شرح واقعه شروع می‌شود. بعد از آن مشخص می‌شود مطالبه، دفاع یا سازش کدام‌یک با موضوع می‌خواند. هیچ پرونده‌ای با حدس درباره نتیجه باز نمی‌شود.",
  },
  {
    slug: "contracts",
    title: "قراردادها",
    summary: "تنظیم و بازبینی پیش از امضا، با زبانی روشن و قابل اجرا.",
    body: "قرارداد خوب اختلاف را کم می‌کند، نه اینکه آن را به آینده موکول کند. موضوع تعهد، مبلغ، زمان، فسخ و ضمانت اجرا باید در خود متن باشد. بازبینی پیش از امضا معمولاً کم‌هزینه‌تر از لایحه پس از اختلاف است.",
  },
  {
    slug: "litigation",
    title: "دعاوی",
    summary: "لایحه، پیگیری و حضور در مسیر دادرسی. نتیجه وعده داده نمی‌شود.",
    body: "وقتی اختلاف به دادرسی می‌رسد، نوشته باید دقیق و پیگیری منظم باشد. محدوده کار، هزینه و گام بعدی پیش از شروع نوشته می‌شود. رأی دادگاه در اختیار این دفتر نیست و قول نتیجه داده نمی‌شود.",
  },
] as const;

export type MatterTopic = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export const defaultMatters: MatterTopic[] = matters.map((matter) => ({
  slug: matter.slug,
  title: matter.title,
  summary: matter.summary,
  body: matter.body,
}));
