import { put } from "@vercel/blob";

export async function uploadOfficeFile(file: File, folder: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN تنظیم نشده است.");
  }
  const safeName = file.name.replace(/[^\w.\-آ-ی۰-۹ ]+/g, "_");
  const blob = await put(`office/${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return {
    url: blob.url,
    fileName: file.name,
    fileMime: file.type || "application/octet-stream",
  };
}
