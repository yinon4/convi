import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import * as mammoth from "mammoth";
import html2pdf from "html2pdf.js";
import * as pdfjsLib from "pdfjs-dist";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

// Set PDF.js worker using CDN to ensure it works in all environments
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Initialize FFmpeg instance
let ffmpeg: FFmpeg | null = null;

const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  try {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
  } catch (error) {
    console.error("Failed to load FFmpeg:", error);
    throw new Error("FFmpeg initialization failed");
  }
  
  return ffmpeg;
};

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
  | "ICO"
  | "MP4"
  | "AVI"
  | "MOV"
  | "MKV"
  | "WEBM"
  | "FLV"
  | "WMV"
  | "MP3"
  | "WAV"
  | "FLAC"
  | "AAC"
  | "OGG"
  | "M4A"
  | "WMA";

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
        children: text.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line })],
            }),
        ),
      },
    ],
  });
  return await Packer.toBlob(doc);
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
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i];
      return obj;
    }, {} as Record<string, string>);
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
            (obj["@attributes"] as Record<string, unknown>)[attribute.nodeName] = attribute.nodeValue;
          }
        }
      }
    } else if (node.nodeType === 3) {
      return node.nodeValue || "";
    }

    if (node.hasChildNodes()) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const item = node.childNodes.item ? node.childNodes.item(i) : node.childNodes[i];
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
    const text = textContent.items
      .filter((item: unknown) => typeof item === "object" && item !== null && "str" in item)
      .map((item: unknown) => (item as { str: string }).str)
      .join(" ");
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
    text +=
      textContent.items
        .filter((item: unknown) => typeof item === "object" && item !== null && "str" in item)
        .map((item: unknown) => (item as { str: string }).str)
        .join(" ") + "\n";
  }
  return new Blob([text], { type: "text/plain" });
};

const pdfToDocx = async (file: File): Promise<Blob> => {
  const textBlob = await pdfToTxt(file);
  const text = await textBlob.text();
  const doc = new Document({
    sections: [
      {
        children: text.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line })],
            }),
        ),
      },
    ],
  });
  return await Packer.toBlob(doc);
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
        children: text.split("\n").map(
          (line) =>
            new Paragraph({
              children: [new TextRun({ text: line })],
            }),
        ),
      },
    ],
  });
  return await Packer.toBlob(doc);
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

const convertVideo = async (file: File, outputFormat: string): Promise<Blob> => {
  const ffmpeg = await getFFmpeg();
  
  const inputFileName = `input.${file.name.split('.').pop()}`;
  const outputFileName = `output.${outputFormat.toLowerCase()}`;
  
  try {
    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    
    // Run FFmpeg command
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:v', 'libx264', // Use H.264 codec for MP4
      '-preset', 'fast',
      '-crf', '22',
      '-c:a', 'aac',
      outputFileName
    ]);
    
    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    return new Blob([data as BlobPart], { type: `video/${outputFormat.toLowerCase()}` });
  } catch (error) {
    console.error("Video conversion failed:", error);
    throw new Error(`Failed to convert video to ${outputFormat}`);
  }
};

const convertAudio = async (file: File, outputFormat: string): Promise<Blob> => {
  const ffmpeg = await getFFmpeg();
  
  const inputFileName = `input.${file.name.split('.').pop()}`;
  const outputFileName = `output.${outputFormat.toLowerCase()}`;
  
  try {
    // Write input file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));
    
    // Run FFmpeg command for audio conversion
    await ffmpeg.exec([
      '-i', inputFileName,
      '-c:a', getAudioCodec(outputFormat),
      '-b:a', '192k', // Set bitrate to 192kbps
      outputFileName
    ]);
    
    // Read output file
    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);
    
    return new Blob([data as BlobPart], { type: `audio/${outputFormat.toLowerCase()}` });
  } catch (error) {
    console.error("Audio conversion failed:", error);
    throw new Error(`Failed to convert audio to ${outputFormat}`);
  }
};

const getAudioCodec = (format: string): string => {
  const codecMap: Record<string, string> = {
    'mp3': 'libmp3lame',
    'wav': 'pcm_s16le',
    'flac': 'flac',
    'aac': 'aac',
    'ogg': 'libvorbis',
    'm4a': 'aac',
    'wma': 'wmav2'
  };
  return codecMap[format.toLowerCase()] || 'aac';
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
      const jsonText = await jsonBlob.text();
      const json = JSON.parse(jsonText);
      // For XML, the root element contains the array
      const rootKey = Object.keys(json)[0];
      const array = Array.isArray(json[rootKey]) ? json[rootKey] : [json[rootKey]];
      const csvJson = JSON.stringify(array);
      const csvFile = new File([csvJson], "temp.json", {
        type: "application/json",
      });
      return jsonToCsv(csvFile);
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
  MP4: {
    AVI: (file) => convertVideo(file, "avi"),
    MOV: (file) => convertVideo(file, "mov"),
    MKV: (file) => convertVideo(file, "mkv"),
    WEBM: (file) => convertVideo(file, "webm"),
    FLV: (file) => convertVideo(file, "flv"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  AVI: {
    MP4: (file) => convertVideo(file, "mp4"),
    MOV: (file) => convertVideo(file, "mov"),
    MKV: (file) => convertVideo(file, "mkv"),
    WEBM: (file) => convertVideo(file, "webm"),
    FLV: (file) => convertVideo(file, "flv"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  MOV: {
    MP4: (file) => convertVideo(file, "mp4"),
    AVI: (file) => convertVideo(file, "avi"),
    MKV: (file) => convertVideo(file, "mkv"),
    WEBM: (file) => convertVideo(file, "webm"),
    FLV: (file) => convertVideo(file, "flv"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  MKV: {
    MP4: (file) => convertVideo(file, "mp4"),
    AVI: (file) => convertVideo(file, "avi"),
    MOV: (file) => convertVideo(file, "mov"),
    WEBM: (file) => convertVideo(file, "webm"),
    FLV: (file) => convertVideo(file, "flv"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  WEBM: {
    MP4: (file) => convertVideo(file, "mp4"),
    AVI: (file) => convertVideo(file, "avi"),
    MOV: (file) => convertVideo(file, "mov"),
    MKV: (file) => convertVideo(file, "mkv"),
    FLV: (file) => convertVideo(file, "flv"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  FLV: {
    MP4: (file) => convertVideo(file, "mp4"),
    AVI: (file) => convertVideo(file, "avi"),
    MOV: (file) => convertVideo(file, "mov"),
    MKV: (file) => convertVideo(file, "mkv"),
    WEBM: (file) => convertVideo(file, "webm"),
    WMV: (file) => convertVideo(file, "wmv"),
  },
  WMV: {
    MP4: (file) => convertVideo(file, "mp4"),
    AVI: (file) => convertVideo(file, "avi"),
    MOV: (file) => convertVideo(file, "mov"),
    MKV: (file) => convertVideo(file, "mkv"),
    WEBM: (file) => convertVideo(file, "webm"),
    FLV: (file) => convertVideo(file, "flv"),
  },
  MP3: {
    WAV: (file) => convertAudio(file, "wav"),
    FLAC: (file) => convertAudio(file, "flac"),
    AAC: (file) => convertAudio(file, "aac"),
    OGG: (file) => convertAudio(file, "ogg"),
    M4A: (file) => convertAudio(file, "m4a"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  WAV: {
    MP3: (file) => convertAudio(file, "mp3"),
    FLAC: (file) => convertAudio(file, "flac"),
    AAC: (file) => convertAudio(file, "aac"),
    OGG: (file) => convertAudio(file, "ogg"),
    M4A: (file) => convertAudio(file, "m4a"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  FLAC: {
    MP3: (file) => convertAudio(file, "mp3"),
    WAV: (file) => convertAudio(file, "wav"),
    AAC: (file) => convertAudio(file, "aac"),
    OGG: (file) => convertAudio(file, "ogg"),
    M4A: (file) => convertAudio(file, "m4a"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  AAC: {
    MP3: (file) => convertAudio(file, "mp3"),
    WAV: (file) => convertAudio(file, "wav"),
    FLAC: (file) => convertAudio(file, "flac"),
    OGG: (file) => convertAudio(file, "ogg"),
    M4A: (file) => convertAudio(file, "m4a"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  OGG: {
    MP3: (file) => convertAudio(file, "mp3"),
    WAV: (file) => convertAudio(file, "wav"),
    FLAC: (file) => convertAudio(file, "flac"),
    AAC: (file) => convertAudio(file, "aac"),
    M4A: (file) => convertAudio(file, "m4a"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  M4A: {
    MP3: (file) => convertAudio(file, "mp3"),
    WAV: (file) => convertAudio(file, "wav"),
    FLAC: (file) => convertAudio(file, "flac"),
    AAC: (file) => convertAudio(file, "aac"),
    OGG: (file) => convertAudio(file, "ogg"),
    WMA: (file) => convertAudio(file, "wma"),
  },
  WMA: {
    MP3: (file) => convertAudio(file, "mp3"),
    WAV: (file) => convertAudio(file, "wav"),
    FLAC: (file) => convertAudio(file, "flac"),
    AAC: (file) => convertAudio(file, "aac"),
    OGG: (file) => convertAudio(file, "ogg"),
    M4A: (file) => convertAudio(file, "m4a"),
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
