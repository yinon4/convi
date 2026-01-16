import jsPDF from "jspdf";
import { Document, Packer, Paragraph } from "docx";
import * as mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import * as pdfjsLib from "pdfjs-dist";

// Set PDF.js worker for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.js",
  import.meta.url,
).toString();

export type FileType = "PDF" | "DOCX" | "TXT" | "JPG" | "PNG" | "WEBP";

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

const docxToTxt = async (file: File): Promise<Blob> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return new Blob([text], { type: "text/plain" });
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
  },
  DOCX: {
    PDF: docxToPdf,
    TXT: docxToTxt,
  },
  PDF: {
    TXT: pdfToTxt,
  },
  JPG: {
    PNG: (file) => convertImage(file, "image/png"),
    WEBP: (file) => convertImage(file, "image/webp"),
  },
  PNG: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    WEBP: (file) => convertImage(file, "image/webp"),
  },
  WEBP: {
    JPG: (file) => convertImage(file, "image/jpeg"),
    PNG: (file) => convertImage(file, "image/png"),
  },
};

// Get possible output formats for a given input format
export const getPossibleOutputs = (input: string): string[] => {
  return Object.keys(converters[input] || {});
};
