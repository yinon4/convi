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

// Conversion functions
const jsonToCsv = async (file: File): Promise<Blob> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    const array = Array.isArray(json) ? json : [json];
    if (array.length === 0) return new Blob([""], { type: "text/csv" });

    const keys = Object.keys(array[0]);
    const csv = [
      keys.join(","),
      ...array.map((row) =>
        keys
          .map((key) => {
            const val = row[key];
            return typeof val === "string" ? `"${val}"` : val;
          })
          .join(","),
      ),
    ].join("\n");
    return new Blob([csv], { type: "text/csv" });
  } catch {
    throw new Error("Invalid JSON: parsing failed");
  }
};

const csvToJson = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return new Blob(["[]"], { type: "application/json" });

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const data = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return headers.reduce(
      (obj, header, i) => {
        obj[header] = values[i];
        return obj;
      },
      {} as Record<string, string>,
    );
  });
  return new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
};

const jsonToXml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    const toXml = (obj: unknown, root = "root"): string => {
      let xml = `<${root}>`;
      if (typeof obj === "object" && obj !== null) {
        for (const key in obj as Record<string, unknown>) {
          const value = (obj as Record<string, unknown>)[key];
          if (typeof value === "object") {
            xml += toXml(value, key);
          } else {
            xml += `<${key}>${String(value)}</${key}>`;
          }
        }
      }
      xml += `</${root}>`;
      return xml;
    };
    return new Blob(
      ['<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(json)],
      {
        type: "application/xml",
      },
    );
  } catch {
    throw new Error("Invalid JSON");
  }
};

const jsonToTxt = async (file: File): Promise<Blob> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    return new Blob([JSON.stringify(json, null, 2)], { type: "text/plain" });
  } catch {
    return new Blob([text], { type: "text/plain" });
  }
};

const txtToJson = async (file: File): Promise<Blob> => {
  const text = await file.text();
  // Try to parse as JSON, if fails, wrap in a JSON object
  try {
    JSON.parse(text);
    return new Blob([text], { type: "application/json" });
  } catch {
    return new Blob([JSON.stringify({ text })], { type: "application/json" });
  }
};

const txtToCsv = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  if (lines.length === 0) return new Blob([text], { type: "text/csv" });
  // Assume first line is header, or create simple CSV
  const csv = lines.map((line) => `"${line.replace(/"/g, '""')}"`).join("\n");
  return new Blob([csv], { type: "text/csv" });
};

const txtToXml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const xml = `<root><text><![CDATA[${text}]]></text></root>`;
  return new Blob([xml], { type: "text/xml" });
};

const xmlToJson = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const xml2json = (node: Node): Record<string, unknown> | string => {
    const obj: Record<string, unknown> = {};
    if (node.nodeType === 1) {
      const element = node as Element;
      if (element.attributes.length > 0) {
        obj["@attributes"] = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attribute = element.attributes.item(i);
          if (attribute) {
            (obj["@attributes"] as Record<string, unknown>)[
              attribute.nodeName
            ] = attribute.nodeValue;
          }
        }
      }
    } else if (node.nodeType === 3) {
      return node.nodeValue || "";
    }

    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const item = node.childNodes.item
          ? node.childNodes.item(i)
          : node.childNodes[i];
        if (item) {
          const nodeName = item.nodeName;
          const existing = obj[nodeName];
          const newValue = xml2json(item);

          if (typeof newValue === "string") {
            if (existing === undefined) {
              obj[nodeName] = newValue;
            } else {
              if (!Array.isArray(existing)) {
                obj[nodeName] = [existing];
              }
              (obj[nodeName] as unknown[]).push(newValue);
            }
          } else {
            if (existing === undefined) {
              obj[nodeName] = newValue;
            } else {
              if (!Array.isArray(existing)) {
                obj[nodeName] = [existing];
              }
              (obj[nodeName] as unknown[]).push(newValue);
            }
          }
        }
      }
    }
    // If the object only has a "#text" property, return the text directly
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === "#text") {
      return obj["#text"] as string;
    }
    return obj;
  };

  const json = xml2json(xmlDoc.documentElement);
  return new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });
};

const htmlToTxt = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";
  return new Blob([cleanText], { type: "text/plain" });
};

const txtToHtml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const html = `<html><body><pre>${text}</pre></body></html>`;
  return new Blob([html], { type: "text/html" });
};

const csvToTsv = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const tsv = text.replace(/,/g, "\t");
  return new Blob([tsv], { type: "text/tab-separated-values" });
};

const tsvToCsv = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const csv = text.replace(/\t/g, ",");
  return new Blob([csv], { type: "text/csv" });
};

const mdToHtml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  // Basic markdown to HTML conversion
  let html = text
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br>");

  html = `<html><body><p>${html}</p></body></html>`;
  return new Blob([html], { type: "text/html" });
};

const convertImage = async (file: File, targetType: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert image"));
      }, targetType);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

// Conversion map
export const converters: Record<
  string,
  Record<string, (file: File) => Promise<Blob>>
> = {
  TXT: {
    HTML: txtToHtml,
    JSON: txtToJson,
    CSV: txtToCsv,
    XML: txtToXml,
    MD: async (file) => {
      const text = await file.text();
      // Basic text to markdown (just wrap as code block)
      const md = "```\n" + text + "\n```";
      return new Blob([md], { type: "text/markdown" });
    },
  },
  JSON: {
    CSV: jsonToCsv,
    TSV: async (file) => {
      const csvBlob = await jsonToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return csvToTsv(csvFile);
    },
    XML: jsonToXml,
    TXT: jsonToTxt,
    MD: async (file) => {
      const text = await file.text();
      // Basic JSON to markdown - format as code block
      const md = "```json\n" + text + "\n```";
      return new Blob([md], { type: "text/markdown" });
    },
  },
  CSV: {
    JSON: csvToJson,
    TSV: csvToTsv,
    XML: async (file) => {
      const jsonBlob = await csvToJson(file);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return jsonToXml(jsonFile);
    },
    TXT: async (file) => {
      const jsonBlob = await csvToJson(file);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return jsonToTxt(jsonFile);
    },
    MD: async (file) => {
      const text = await file.text();
      // Basic CSV to markdown - format as table
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length === 0) return new Blob([""], { type: "text/markdown" });

      const headers = lines[0].split(",");
      const rows = lines.slice(1);

      let md = "| " + headers.join(" | ") + " |\n";
      md += "| " + headers.map(() => "---").join(" | ") + " |\n";

      rows.forEach((row) => {
        const cells = row.split(",");
        md += "| " + cells.join(" | ") + " |\n";
      });

      return new Blob([md], { type: "text/markdown" });
    },
  },
  XML: {
    JSON: xmlToJson,
    CSV: async (file) => {
      const jsonBlob = await xmlToJson(file);
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
      return jsonToCsv(csvFile);
    },
    TSV: async (file) => {
      const csvBlob = await (async (file) => {
        const jsonBlob = await xmlToJson(file);
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
        return jsonToCsv(csvFile);
      })(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return csvToTsv(csvFile);
    },
    TXT: async (file) => {
      const jsonBlob = await xmlToJson(file);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return jsonToTxt(jsonFile);
    },
    MD: async (file) => {
      const text = await file.text();
      // Basic XML to markdown - format as code block
      const md = "```xml\n" + text + "\n```";
      return new Blob([md], { type: "text/markdown" });
    },
  },
  HTML: {
    TXT: htmlToTxt,
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
        .replace(/<br[^>]*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "") // Remove remaining HTML tags
        .trim();
      return new Blob([md], { type: "text/markdown" });
    },
  },
  TSV: {
    CSV: tsvToCsv,
    JSON: async (file) => {
      const csvBlob = await tsvToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      return csvToJson(csvFile);
    },
    XML: async (file) => {
      const csvBlob = await tsvToCsv(file);
      const csvFile = new File([csvBlob], "temp.csv", {
        type: "text/csv",
      });
      const jsonBlob = await csvToJson(csvFile);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return jsonToXml(jsonFile);
    },
    TXT: async (file) => {
      const text = await file.text();
      return new Blob([text], { type: "text/plain" });
    },
    MD: async (file) => {
      const text = await file.text();
      // Basic TSV to markdown - format as table
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length === 0) return new Blob([""], { type: "text/markdown" });

      const headers = lines[0].split("\t");
      const rows = lines.slice(1);

      let md = "| " + headers.join(" | ") + " |\n";
      md += "| " + headers.map(() => "---").join(" | ") + " |\n";

      rows.forEach((row) => {
        const cells = row.split("\t");
        md += "| " + cells.join(" | ") + " |\n";
      });

      return new Blob([md], { type: "text/markdown" });
    },
  },
  MD: {
    HTML: mdToHtml,
    TXT: async (file) => {
      const text = await file.text();
      return new Blob([text], { type: "text/plain" });
    },
  },
  JPG: {
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
    GIF: (file) => convertImage(file, "image/gif"),
  },
  PNG: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
    GIF: (file) => convertImage(file, "image/gif"),
  },
  WEBP: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    BMP: (file) => convertImage(file, "image/bmp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
    GIF: (file) => convertImage(file, "image/gif"),
  },
  BMP: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
    GIF: (file) => convertImage(file, "image/gif"),
  },
  ICO: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    GIF: (file) => convertImage(file, "image/gif"),
  },
  GIF: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
};

// Get possible output formats for a given input format
export const getPossibleOutputs = (input: string): string[] => {
  const normalized = normalizeFormat(input);
  return Object.keys(converters[normalized] || {});
};

export const normalizeFormat = (format: string): string => {
  const f = format.toUpperCase();
  if (f === "JPEG") return "JPG";
  if (f === "HTM") return "HTML";
  return f;
};
