export type FileType =
  | "TXT"
  | "JPG"
  | "PNG"
  | "WEBP"
  | "JSON"
  | "CSV"
  | "XML"
  | "HTML"
  | "BMP"
  | "ICO"
  | "GIF"
  | "TSV"
  | "MD";

export type ConverterFunction = (file: File, progressCallback?: (progress: number) => void) => Promise<Blob>;

export type ImageConverterFunction = (file: File, targetType: string, onProgress?: (progress: number) => void) => Promise<Blob>;

export type ConverterMap = Record<string, ConverterFunction>;

export type ImageConverterMap = Record<string, ImageConverterFunction>;

export const normalizeFormat = (format: string): string => {
  const f = format.toUpperCase();
  if (f === "JPEG") return "JPG";
  if (f === "HTM") return "HTML";
  return f;
};
