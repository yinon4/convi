import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import * as mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker using CDN to ensure it works in all environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export type FileType =
  | "PDF"
  | "DOCX"
  | "TXT"
  | "JPG"
  | "PNG"
  | "WEBP"
  | "JSON"
  | "CSV"
  | "XML"
  | "HTML"
  | "BMP"
  | "ICO";

// Conversion functions
const txtToPdf = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);
  doc.text(lines, 10, 10);
  return doc.output("blob");
};

const txtToDocx = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const doc = new Document({
    sections: [
      {
        children: [new Paragraph(text)],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

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
  } catch (e) {
    throw new Error("Invalid JSON: " + (e as Error).message);
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
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {} as any);
  });
  return new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
};

const jsonToXml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    const toXml = (obj: any, root = "root"): string => {
      let xml = `<${root}>`;
      for (const key in obj) {
        if (typeof obj[key] === "object") {
          xml += toXml(obj[key], key);
        } else {
          xml += `<${key}>${obj[key]}</${key}>`;
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
  } catch (e) {
    throw new Error("Invalid JSON");
  }
};

const jsonToTxt = async (file: File): Promise<Blob> => {
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    return new Blob([JSON.stringify(json, null, 2)], { type: "text/plain" });
  } catch (e) {
    return new Blob([text], { type: "text/plain" });
  }
};

const xmlToJson = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const xml2json = (node: Node): any => {
    const obj: any = {};
    if (node.nodeType === 1) {
      if ((node as Element).attributes.length > 0) {
        obj["@attributes"] = {};
        for (let i = 0; i < (node as Element).attributes.length; i++) {
          const attribute = (node as Element).attributes.item(i);
          if (attribute)
            obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (node.nodeType === 3) {
      return node.nodeValue;
    }

    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const item = node.childNodes.item(i);
        const nodeName = item.nodeName;
        if (typeof obj[nodeName] === "undefined") {
          obj[nodeName] = xml2json(item);
        } else {
          if (typeof obj[nodeName].push === "undefined") {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xml2json(item));
        }
      }
    }
    return obj;
  };

  const json = xml2json(xmlDoc.documentElement);
  return new Blob([JSON.stringify(json, null, 2)], {
    type: "application/json",
  });
};

const htmlToPdf = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const element = document.createElement("div");
  element.innerHTML = text;
  const options = {
    margin: 1,
    filename: "output.pdf",
    html2canvas: { scale: 2 },
  };
  return html2pdf().set(options).from(element).outputPdf("blob");
};

const htmlToTxt = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  const cleanText = tempDiv.textContent || tempDiv.innerText || "";
  return new Blob([cleanText], { type: "text/plain" });
};

const docxToPdf = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  const element = document.createElement("div");
  element.innerHTML = html;
  const options = {
    margin: 1,
    filename: "output.pdf",
    html2canvas: { scale: 2 },
  };
  return html2pdf().set(options).from(element).outputPdf("blob");
};

const docxToHtml = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  return new Blob([result.value], { type: "text/html" });
};

const docxToTxt = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return new Blob([text], { type: "text/plain" });
};

const pdfToHtml = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let html = "<html><body>";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(" ");
    html += `<p>${text}</p>`;
  }
  html += "</body></html>";
  return new Blob([html], { type: "text/html" });
};

const pdfToTxt = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item: any) => item.str).join(" ") + "\n";
  }
  return new Blob([text], { type: "text/plain" });
};

const pdfToDocx = async (file: File): Promise<Blob> => {
  const textBlob = await pdfToTxt(file);
  const text = await textBlob.text();
  const doc = new Document({
    sections: [
      {
        children: [new Paragraph(text)],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
};

const txtToHtml = async (file: File): Promise<Blob> => {
  const text = await file.text();
  const html = `<html><body><pre>${text}</pre></body></html>`;
  return new Blob([html], { type: "text/html" });
};

const htmlToDocx = async (file: File): Promise<Blob> => {
  const textBlob = await htmlToTxt(file);
  const text = await textBlob.text();
  const doc = new Document({
    sections: [
      {
        children: [new Paragraph(text)],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
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
    PDF: txtToPdf,
    DOCX: txtToDocx,
    HTML: txtToHtml,
  },
  DOCX: {
    PDF: docxToPdf,
    TXT: docxToTxt,
    HTML: docxToHtml,
  },
  PDF: {
    TXT: pdfToTxt,
    DOCX: pdfToDocx,
    HTML: pdfToHtml,
  },
  JSON: {
    CSV: jsonToCsv,
    XML: jsonToXml,
    TXT: jsonToTxt,
  },
  CSV: {
    JSON: csvToJson,
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
  },
  XML: {
    JSON: xmlToJson,
    CSV: async (file) => {
      const jsonBlob = await xmlToJson(file);
      const jsonFile = new File([jsonBlob], "temp.json", {
        type: "application/json",
      });
      return jsonToCsv(jsonFile);
    },
  },
  HTML: {
    PDF: htmlToPdf,
    TXT: htmlToTxt,
    DOCX: htmlToDocx,
  },
  JPG: {
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    GIF: (file) => convertImage(file, "image/gif"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
  PNG: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    GIF: (file) => convertImage(file, "image/gif"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
  WEBP: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    BMP: (file) => convertImage(file, "image/bmp"),
    GIF: (file) => convertImage(file, "image/gif"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
  BMP: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    GIF: (file) => convertImage(file, "image/gif"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
  GIF: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    ICO: (file) => convertImage(file, "image/x-icon"),
  },
  ICO: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
    BMP: (file) => convertImage(file, "image/bmp"),
    GIF: (file) => convertImage(file, "image/gif"),
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
