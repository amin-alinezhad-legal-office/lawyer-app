import type { MetadataRoute } from "next";
import { notes } from "@/lib/notes";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/practice", "/insights", "/contact", ...notes.map((note) => `/insights/${note.slug}`)];
  return paths.map((path) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
  }));
}
