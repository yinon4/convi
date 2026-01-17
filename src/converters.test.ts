import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Load real test files
const testFiles = {
  txt: new File([readFileSync(join(process.cwd(), "test/fixtures/test.txt"))], "test.txt", { type: "text/plain" }),
  json: new File([readFileSync(join(process.cwd(), "test/fixtures/test.json"))], "test.json", { type: "application/json" }),
  csv: new File([readFileSync(join(process.cwd(), "test/fixtures/test.csv"))], "test.csv", { type: "text/csv" }),
  xml: new File([readFileSync(join(process.cwd(), "test/fixtures/test.xml"))], "test.xml", { type: "application/xml" }),
  html: new File([readFileSync(join(process.cwd(), "test/fixtures/test.html"))], "test.html", { type: "text/html" }),
  pdf: new File([readFileSync(join(process.cwd(), "test/fixtures/test.pdf"))], "test.pdf", { type: "application/pdf" }),
};

// Mock browser APIs that don't exist in Node.js
if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "mock-url");
  window.URL.revokeObjectURL = vi.fn();
// @ts-ignore - Mock for browser environment
  ((window as unknown) as { DOMMatrix: typeof DOMMatrix }).DOMMatrix = class DOMMatrix {};
}

// @ts-ignore - Mock for DOMParser
(globalThis as unknown as { DOMParser: new () => DOMParser }).DOMParser = vi.fn().mockImplementation(function() {
  return {
    parseFromString: vi.fn().mockImplementation((xmlString: string) => {
      // Mock XML parsing for test files
      if (xmlString.includes("<root>")) {
        const childNodes = [
          {
            nodeType: 1,
            nodeName: "person",
            attributes: { length: 0 },
            childNodes: [
              { nodeType: 1, nodeName: "name", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "John" }], hasChildNodes: vi.fn().mockReturnValue(true) },
              { nodeType: 1, nodeName: "age", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "30" }], hasChildNodes: vi.fn().mockReturnValue(true) },
              { nodeType: 1, nodeName: "city", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "New York" }], hasChildNodes: vi.fn().mockReturnValue(true) }
            ],
            hasChildNodes: vi.fn().mockReturnValue(true),
          },
          {
            nodeType: 1,
            nodeName: "person",
            attributes: { length: 0 },
            childNodes: [
              { nodeType: 1, nodeName: "name", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "Jane" }], hasChildNodes: vi.fn().mockReturnValue(true) },
              { nodeType: 1, nodeName: "age", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "25" }], hasChildNodes: vi.fn().mockReturnValue(true) },
              { nodeType: 1, nodeName: "city", attributes: { length: 0 }, childNodes: [{ nodeType: 3, nodeName: "#text", nodeValue: "London" }], hasChildNodes: vi.fn().mockReturnValue(true) }
            ],
            hasChildNodes: vi.fn().mockReturnValue(true),
          }
        ];
        // @ts-ignore - Mock childNodes
        childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[index]);
        childNodes.length = 2;

        // @ts-ignore - Mock childNodes
        childNodes[0].childNodes[0].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[0].childNodes[0].childNodes[index]);
        childNodes[0].childNodes[0].childNodes.length = 1;
        // @ts-ignore - Mock childNodes
        childNodes[0].childNodes[1].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[0].childNodes[1].childNodes[index]);
        childNodes[0].childNodes[1].childNodes.length = 1;
        // @ts-ignore - Mock childNodes
        childNodes[0].childNodes[2].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[0].childNodes[2].childNodes[index]);
        childNodes[0].childNodes[2].childNodes.length = 1;
        
        // @ts-ignore - Mock childNodes
        childNodes[1].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[1].childNodes[index]);
        childNodes[1].childNodes.length = 3;
        // @ts-ignore - Mock childNodes
        childNodes[1].childNodes[0].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[1].childNodes[0].childNodes[index]);
        childNodes[1].childNodes[0].childNodes.length = 1;
        // @ts-ignore - Mock childNodes
        childNodes[1].childNodes[1].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[1].childNodes[1].childNodes[index]);
        childNodes[1].childNodes[1].childNodes.length = 1;
        // @ts-ignore - Mock childNodes
        childNodes[1].childNodes[2].childNodes.item = vi.fn().mockImplementation((index: number) => childNodes[1].childNodes[2].childNodes[index]);
        childNodes[1].childNodes[2].childNodes.length = 1;

        return {
          documentElement: {
            childNodes,
            hasChildNodes: vi.fn().mockReturnValue(true),
          },
        };
      }
      return {
        documentElement: {
          childNodes: { item: vi.fn().mockReturnValue(null), length: 0 },
          hasChildNodes: vi.fn().mockReturnValue(false),
        },
      };
    }),
  };
});

// @ts-ignore - Mock document
(globalThis as unknown as { document: Document }).document = {
  createElement: vi.fn().mockImplementation(() => {
    let htmlContent = "";
    const element = {
      get innerHTML() {
        return htmlContent;
      },
      set innerHTML(value: string) {
        htmlContent = value;
        // Extract text content from HTML
        this.textContent = value.replace(/<[^>]*>/g, "").trim();
        this.innerText = this.textContent;
      },
      textContent: "",
      innerText: "",
    };
    return element;
  }),
};

// Polyfill Blob.text() and Blob.arrayBuffer() if missing (JSDOM might miss them)
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
  Blob.prototype.text = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(this);
    });
  };
}

if (typeof Blob !== "undefined" && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(this);
    });
  };
}

vi.mock("html2pdf.js", () => {
  const mockHtml2Pdf = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    outputPdf: vi.fn().mockResolvedValue(new Blob(["mock-pdf-content"], { type: "application/pdf" })),
  });
  return { default: mockHtml2Pdf };
});

vi.mock("pdfjs-dist", () => {
  return {
    GlobalWorkerOptions: { workerSrc: "" },
    version: "1.0.0",
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [
              { str: "Hello World" },
              { str: "This is a test text file." },
              { str: "It has multiple lines." }
            ],
          }),
        }),
      }),
    }),
  };
});

vi.mock("mammoth", () => ({
  convertToHtml: vi.fn().mockResolvedValue({
    value: "<p>Hello World</p><p>This is a test text file.</p><p>It has multiple lines.</p>"
  }),
}));

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn().mockImplementation(function() {
    return {
      load: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      exec: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    };
  }),
}));

vi.mock("@ffmpeg/util", () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  toBlobURL: vi.fn().mockResolvedValue("blob:url"),
}));

vi.mock("docx", () => ({
  Document: vi.fn(),
  Packer: {
    toBlob: vi.fn().mockResolvedValue(new Blob(["mock-docx"], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })),
  },
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
}));

// Import converters AFTER mocks
import { converters } from "./converters";
import { Paragraph, TextRun } from "docx";

describe("Converters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TXT Conversions", () => {
    it("converts TXT to PDF", async () => {
      const result = await converters.TXT.PDF(testFiles.txt);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");
    });

    it("converts TXT to DOCX", async () => {
      const result = await converters.TXT.DOCX(testFiles.txt);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });

    it("converts TXT to HTML", async () => {
      const result = await converters.TXT.HTML(testFiles.txt);
      const text = await result.text();
      expect(text).toContain("Hello World");
      expect(text).toContain("test text file");
      expect(text).toContain("<html><body><pre>");
    });
  });

  describe("JSON Conversions", () => {
    it("converts JSON to CSV", async () => {
      const result = await converters.JSON.CSV(testFiles.json);
      const text = await result.text();
      expect(text).toContain("name,age,city");
      expect(text).toContain('"John",30,"New York"');
    });

    it("converts JSON to XML", async () => {
      const result = await converters.JSON.XML(testFiles.json);
      const text = await result.text();
      expect(text).toContain("<name>John</name>");
      expect(text).toContain("<age>30</age>");
      expect(text).toContain("<city>New York</city>");
    });

    it("converts JSON to TXT", async () => {
      const result = await converters.JSON.TXT(testFiles.json);
      const text = await result.text();
      expect(text).toContain('"name": "John"');
      expect(text).toContain('"age": 30');
      expect(text).toContain('"city": "New York"');
    });
  });

  describe("CSV Conversions", () => {
    it("converts CSV to JSON", async () => {
      const result = await converters.CSV.JSON(testFiles.csv);
      const text = await result.text();
      const json = JSON.parse(text);
      expect(json).toHaveLength(3);
      expect(json[0].name).toBe("John");
      expect(json[0].age).toBe("30");
      expect(json[0].city).toBe("New York");
    });

    it("converts CSV to XML", async () => {
      const result = await converters.CSV.XML(testFiles.csv);
      const text = await result.text();
      expect(text).toContain("<name>John</name>");
      expect(text).toContain("<age>30</age>");
    });

    it("converts CSV to TXT", async () => {
      const result = await converters.CSV.TXT(testFiles.csv);
      const text = await result.text();
      expect(text).toContain("John");
      expect(text).toContain("30");
      expect(text).toContain("New York");
    });
  });

  describe("XML Conversions", () => {
    it("converts XML to JSON", async () => {
      const result = await converters.XML.JSON(testFiles.xml);
      const text = await result.text();
      const json = JSON.parse(text);
      expect(json.person).toBeDefined();
      expect(json.person[0].name).toBe("John");
      expect(json.person[0].age).toBe("30");
      expect(json.person[0].city).toBe("New York");
    });

    it("converts XML to CSV", async () => {
      const result = await converters.XML.CSV(testFiles.xml);
      const text = await result.text();
      expect(text).toContain("name,age,city");
      expect(text).toContain('"John","30","New York"');
    });
  });

  describe("HTML Conversions", () => {
    it("converts HTML to TXT", async () => {
      const result = await converters.HTML.TXT(testFiles.html);
      const text = await result.text();
      expect(text).toContain("Hello World");
      expect(text).toContain("test HTML file");
    });

    it("converts HTML to PDF", async () => {
      const result = await converters.HTML.PDF(testFiles.html);
      expect(result.type).toBe("application/pdf");
    });

    it("converts HTML to DOCX", async () => {
      const result = await converters.HTML.DOCX(testFiles.html);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });
  });

  describe("PDF Conversions", () => {
    it("converts PDF to TXT", async () => {
      const result = await converters.PDF.TXT(testFiles.pdf);
      const text = await result.text();
      expect(text).toContain("Hello World");
    });

    it("converts PDF to HTML", async () => {
      const result = await converters.PDF.HTML(testFiles.pdf);
      const text = await result.text();
      expect(text).toContain("Hello World");
      expect(text).toContain("<html><body>");
    });

    it("converts PDF to DOCX", async () => {
      const result = await converters.PDF.DOCX(testFiles.pdf);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      expect(result).toBeInstanceOf(Blob);

      // Verify that docx components were called correctly
      // Paragraph should be called for each line (mock returns "Hello World\n")
      expect(Paragraph).toHaveBeenCalled();
      expect(TextRun).toHaveBeenCalled();

      // Check that it was called with an object, not just a string (the reported bug)
      const firstParaCall = vi.mocked(Paragraph).mock.calls[0][0];
      expect(typeof firstParaCall).toBe("object");
      expect(firstParaCall).toHaveProperty("children");

      const firstTextRunCall = vi.mocked(TextRun).mock.calls[0][0];
      expect(typeof firstTextRunCall).toBe("object");
      expect(firstTextRunCall).toHaveProperty("text", "Hello World This is a test text file. It has multiple lines.");
    });
  });

  describe("DOCX Conversions", () => {
    // DOCX to X uses mammoth, which we might need to mock if it fails in node
    const docxFile = new File(["fake-docx-content"], "test.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    vi.mock("mammoth", () => ({
      convertToHtml: vi
        .fn()
        .mockResolvedValue({ value: "<p>mock docx text</p>" }),
    }));

    it("converts DOCX to HTML", async () => {
      const result = await converters.DOCX.HTML(docxFile);
      const text = await result.text();
      expect(text).toContain("mock docx text");
    });

    it("converts DOCX to TXT", async () => {
      const result = await converters.DOCX.TXT(docxFile);
      const text = await result.text();
      expect(text).toContain("mock docx text");
    });

    it("converts DOCX to PDF", async () => {
      const result = await converters.DOCX.PDF(docxFile);
      expect(result.type).toBe("application/pdf");
    });
  });

  describe("Image Conversions", () => {
    it("has all expected conversion methods for JPG", () => {
      const formats = ["PNG", "WEBP", "BMP", "GIF", "ICO"];
      formats.forEach((f) => {
        expect(converters.JPG[f]).toBeDefined();
      });
    });

    it("has all expected conversion methods for PNG", () => {
      const formats = ["JPG", "WEBP", "BMP", "GIF", "ICO"];
      formats.forEach((f) => {
        expect(converters.PNG[f]).toBeDefined();
      });
    });
  });

  describe("Video Conversions", () => {
    const videoFile = new File(["fake-video-content"], "test.mp4", {
      type: "video/mp4",
    });

    it("converts MP4 to AVI", async () => {
      const result = await converters.MP4.AVI(videoFile);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("video/avi");
    });

    it("converts AVI to MP4", async () => {
      const aviFile = new File(["fake-video-content"], "test.avi", {
        type: "video/avi",
      });
      const result = await converters.AVI.MP4(aviFile);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("video/mp4");
    });

    it("has all expected conversion methods for MP4", () => {
      const formats = ["AVI", "MOV", "MKV", "WEBM", "FLV", "WMV"];
      formats.forEach((f) => {
        expect(converters.MP4[f]).toBeDefined();
      });
    });

    it("has all expected conversion methods for AVI", () => {
      const formats = ["MP4", "MOV", "MKV", "WEBM", "FLV", "WMV"];
      formats.forEach((f) => {
        expect(converters.AVI[f]).toBeDefined();
      });
    });
  });

  describe("Audio Conversions", () => {
    const audioFile = new File(["fake-audio-content"], "test.mp3", {
      type: "audio/mp3",
    });

    it("converts MP3 to WAV", async () => {
      const result = await converters.MP3.WAV(audioFile);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("audio/wav");
    });

    it("converts WAV to MP3", async () => {
      const wavFile = new File(["fake-audio-content"], "test.wav", {
        type: "audio/wav",
      });
      const result = await converters.WAV.MP3(wavFile);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("audio/mp3");
    });

    it("has all expected conversion methods for MP3", () => {
      const formats = ["WAV", "FLAC", "AAC", "OGG", "M4A", "WMA"];
      formats.forEach((f) => {
        expect(converters.MP3[f]).toBeDefined();
      });
    });

    it("has all expected conversion methods for WAV", () => {
      const formats = ["MP3", "FLAC", "AAC", "OGG", "M4A", "WMA"];
      formats.forEach((f) => {
        expect(converters.WAV[f]).toBeDefined();
      });
    });
  });
});
