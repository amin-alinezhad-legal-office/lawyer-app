import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alinezhad App",
    short_name: "Alinezhad App",
    description: "دفتر کار خصوصی وکیل: پرونده، بایگانی، یادآور و نامه",
    start_url: "/app",
    scope: "/app",
    id: "/app",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#1a3571",
    theme_color: "#1a3571",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
