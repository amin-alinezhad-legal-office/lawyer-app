import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "دفتر محمد امین علی نژاد قادی",
    short_name: "دفتر علی‌نژاد",
    description: "دفتر کار خصوصی وکیل: پرونده، بایگانی، یادآور و نامه",
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    background_color: "#1a3571",
    theme_color: "#1a3571",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
