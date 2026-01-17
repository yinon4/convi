import type { FileType, ConverterMap, ImageConverterMap } from "./types";
import { normalizeFormat } from "./types";

// Lazy-loaded converter modules
let textConverters: ConverterMap | null = null;
let imageConverters: ImageConverterMap | null = null;

// Lazy load text converters
const loadTextConverters = async () => {
  if (!textConverters) {
    const module = await import("./textConverters");
    textConverters = module.textConverters;
  }
  return textConverters;
};

// Lazy load image converters
const loadImageConverters = async () => {
  if (!imageConverters) {
    const module = await import("./imageConverters");
    imageConverters = module.imageConverters;
  }
  return imageConverters;
};

// Reconstruct the converters object to maintain API compatibility
export const converters: Record<
  string,
  Record<
    string,
    (file: File, onProgress?: (progress: number) => void) => Promise<Blob>
  >
> = {
  TXT: {
    MD: async (file) => {
      const text = await file.text();
      // Basic text to markdown (just wrap as code block)
      const md = "```\n" + text + "\n```";
      return new Blob([md], { type: "text/markdown" });
    },
  },
  JSON: {
    CSV: async (file) => {
      const converters = await loadTextConverters();
      return converters.jsonToCsv(file);
    },
    TSV: async (file) => {
      const converters = await loadTextConverters();
      const csvBlob = await converters.jsonToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return converters.csvToTsv(csvFile);
    },
    XML: async (file) => {
      const converters = await loadTextConverters();
      return converters.jsonToXml(file);
    },
  },
  CSV: {
    JSON: async (file) => {
      const converters = await loadTextConverters();
      return converters.csvToJson(file);
    },
    TSV: async (file) => {
      const converters = await loadTextConverters();
      return converters.csvToTsv(file);
    },
    XML: async (file) => {
      const converters = await loadTextConverters();
      const jsonBlob = await converters.csvToJson(file);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return converters.jsonToXml(jsonFile);
    },
  },
  XML: {
    JSON: async (file) => {
      const converters = await loadTextConverters();
      return converters.xmlToJson(file);
    },
    CSV: async (file) => {
      const converters = await loadTextConverters();
      const jsonBlob = await converters.xmlToJson(file);
      const jsonText = await jsonBlob.text();
      const json = JSON.parse(jsonText);
      // For XML, the root element contains the array
      const rootKey = Object.keys(json)[0];
      const array = Array.isArray(json[rootKey])
        ? json[rootKey]
        : [json[rootKey]];
      const csvJson = JSON.stringify(array);
      const csvFile = new File([csvJson], "temp.json", {
        type: "application/json",
      });
      return converters.jsonToCsv(csvFile);
    },
    TSV: async (file) => {
      const converters = await loadTextConverters();
      const jsonBlob = await converters.xmlToJson(file);
      const jsonText = await jsonBlob.text();
      const json = JSON.parse(jsonText);
      // For XML, the root element contains the array
      const rootKey = Object.keys(json)[0];
      const array = Array.isArray(json[rootKey])
        ? json[rootKey]
        : [json[rootKey]];
      const csvJson = JSON.stringify(array);
      const csvFile = new File([csvJson], "temp.json", {
        type: "application/json",
      });
      const csvBlob = await converters.jsonToCsv(csvFile);
      const csvFile2 = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return converters.csvToTsv(csvFile2);
    },
  },
  HTML: {
    MD: async (file) => {
      const text = await file.text();
      // Basic HTML to markdown conversion
      const md = text
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
        .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
        .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
        .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
        .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
        .replace(/<br[^>]*>/gi, "\n")
        .replace(/<[^>]*>/g, ""); // Remove remaining HTML tags

      return new Blob([md], { type: "text/markdown" });
    },
  },
  TSV: {
    CSV: async (file) => {
      const converters = await loadTextConverters();
      return converters.tsvToCsv(file);
    },
    JSON: async (file) => {
      const converters = await loadTextConverters();
      const csvBlob = await converters.tsvToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return converters.csvToJson(csvFile);
    },
    XML: async (file) => {
      const converters = await loadTextConverters();
      const csvBlob = await converters.tsvToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      const jsonBlob = await converters.csvToJson(csvFile);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return converters.jsonToXml(jsonFile);
    },
  },
  MD: {
    HTML: async (file) => {
      const converters = await loadTextConverters();
      return converters.mdToHtml(file);
    },
  },
  JPG: {
    PNG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/png", onProgress);
    },
    WEBP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/webp", onProgress);
    },
    BMP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/bmp", onProgress);
    },
    ICO: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/x-icon", onProgress);
    },
    GIF: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/gif", onProgress);
    },
  },
  PNG: {
    JPG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/jpeg", onProgress);
    },
    WEBP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/webp", onProgress);
    },
    BMP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/bmp", onProgress);
    },
    ICO: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/x-icon", onProgress);
    },
    GIF: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/gif", onProgress);
    },
  },
  WEBP: {
    JPG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/jpeg", onProgress);
    },
    PNG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/png", onProgress);
    },
    BMP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/bmp", onProgress);
    },
    ICO: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/x-icon", onProgress);
    },
    GIF: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/gif", onProgress);
    },
  },
  BMP: {
    JPG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/jpeg", onProgress);
    },
    PNG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/png", onProgress);
    },
    WEBP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/webp", onProgress);
    },
    ICO: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/x-icon", onProgress);
    },
    GIF: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/gif", onProgress);
    },
  },
  ICO: {
    JPG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/jpeg", onProgress);
    },
    PNG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/png", onProgress);
    },
    WEBP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/webp", onProgress);
    },
    BMP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/bmp", onProgress);
    },
    GIF: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/gif", onProgress);
    },
  },
  GIF: {
    JPG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/jpeg", onProgress);
    },
    PNG: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/png", onProgress);
    },
    WEBP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/webp", onProgress);
    },
    BMP: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/bmp", onProgress);
    },
    ICO: async (file, onProgress) => {
      const converters = await loadImageConverters();
      return converters.convertImage(file, "image/x-icon", onProgress);
    },
  },
};

// Get possible output formats for a given input format
export const getPossibleOutputs = (input: string): string[] => {
  const normalized = normalizeFormat(input);
  return Object.keys(converters[normalized] || {});
};

export type { FileType };
export { normalizeFormat };
