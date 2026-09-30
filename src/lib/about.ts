import { site } from "@/lib/site";

export type AboutContent = {
  kicker: string;
  title: string;
  lede: string;
  ctaLabel: string;
  ctaHref: string;
  sections: { id: string; title: string; body: string; sortOrder: number; active: boolean }[];
};

export const defaultAboutContent: AboutContent = {
  kicker: site.role,
  title: "دفتری برای کار حقوقی آرام.",
  lede: `${site.name}، ${site.role} در ${site.bar}. شماره پروانه ${site.license}. دفتر در الهیه است.`,
  ctaLabel: "برای وقت مشاوره، درخواست بفرستید.",
  ctaHref: "/contact",
  sections: [
    {
      id: "intro-1",
      title: "",
      body: `جمله راهنمای کار این است: ${site.motto} امانت یعنی واقعیت پرونده همان‌طور که هست گفته شود، نه آن‌طور که شنیدنش راحت‌تر است.`,
      sortOrder: 0,
      active: true,
    },
    {
      id: "intro-2",
      title: "",
      body: "محدوده کار، امور مدنی، قراردادها و دعاوی است. اگر موضوع بیرون از این محدوده باشد، همان ابتدا گفته می‌شود تا وقت کسی تلف نشود.",
      sortOrder: 1,
      active: true,
    },
    {
      id: "method",
      title: "شیوه کار",
      body: "اول اسناد خوانده می‌شود. حافظه و روایت شفاهی کنار سند قرار می‌گیرد، نه به‌جای آن.\n\nبعد مسئله به زبان ساده بازگو می‌شود تا همان چیزی شنیده شود که فهمیده شده است. اگر فاصله‌ای باشد، پیش از هر نوشته اصلاح می‌شود.\n\nسپس گام بعدی، با زمان و هزینه قابل فهم، پیشنهاد می‌شود. ادامه کار فقط بعد از همین روشنی شروع می‌شود.",
      sortOrder: 2,
      active: true,
    },
    {
      id: "disclaimer",
      title: "آنچه این وب‌سایت نیست",
      body: "این صفحه معرفی دفتر است. خواندنش رابطه وکالت نمی‌سازد و جای مشاوره روی یک پرونده مشخص را نمی‌گیرد. نتیجه هیچ رأیی اینجا وعده داده نمی‌شود.",
      sortOrder: 3,
      active: true,
    },
  ],
};
