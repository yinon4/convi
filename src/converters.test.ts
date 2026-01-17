import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock browser APIs and complex libraries before importing converters
if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "mock-url");
  window.URL.revokeObjectURL = vi.fn();
  // Mock DOMMatrix for pdfjs
  (window as any).DOMMatrix = class DOMMatrix {};
}

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
    outputPdf: vi
      .fn()
      .mockResolvedValue(new Blob(["mock-pdf"], { type: "application/pdf" })),
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
            items: [{ str: "mock pdf text" }],
          }),
        }),
      }),
    }),
  };
});

vi.mock("docx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("docx")>();
  return {
    ...actual,
    Paragraph: vi.fn(function (options) {
      return new actual.Paragraph(options);
    }),
    TextRun: vi.fn(function (options) {
      return new actual.TextRun(options);
    }),
    Packer: {
      toBlob: vi
        .fn()
        .mockResolvedValue(
          new Blob(["mock-docx-content"], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ),
    },
  };
});

// Import converters AFTER mocks
import { converters } from "./converters";
import { Paragraph, TextRun } from "docx";

describe("Converters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TXT Conversions", () => {
    it("converts TXT to PDF", async () => {
      const file = new File(["hello world"], "test.txt", {
        type: "text/plain",
      });
      const result = await converters.TXT.PDF(file);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");
    });

    it("converts TXT to DOCX", async () => {
      const file = new File(["hello world"], "test.txt", {
        type: "text/plain",
      });
      const result = await converters.TXT.DOCX(file);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });

    it("converts TXT to HTML", async () => {
      const file = new File(["hello world"], "test.txt", {
        type: "text/plain",
      });
      const result = await converters.TXT.HTML(file);
      const text = await result.text();
      expect(text).toContain("hello world");
      expect(text).toContain("<html><body><pre>");
    });
  });

  describe("JSON Conversions", () => {
    it("converts JSON to CSV", async () => {
      const json = JSON.stringify([
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ]);
      const file = new File([json], "test.json", { type: "application/json" });
      const result = await converters.JSON.CSV(file);
      const text = await result.text();
      expect(text).toContain("name,age");
      expect(text).toContain('"John",30');
      expect(text).toContain('"Jane",25');
    });

    it("converts JSON to XML", async () => {
      const json = JSON.stringify({ person: { name: "John", age: 30 } });
      const file = new File([json], "test.json", { type: "application/json" });
      const result = await converters.JSON.XML(file);
      const text = await result.text();
      expect(text).toContain("<person>");
      expect(text).toContain("<name>John</name>");
      expect(text).toContain("<age>30</age>");
    });

    it("converts JSON to TXT", async () => {
      const json = JSON.stringify({ name: "John" }, null, 2);
      const file = new File([json], "test.json", { type: "application/json" });
      const result = await converters.JSON.TXT(file);
      const text = await result.text();
      expect(text).toBe(json);
    });
  });

  describe("CSV Conversions", () => {
    const csvContent = "name,age\nJohn,30\nJane,25";
    const csvFile = new File([csvContent], "test.csv", { type: "text/csv" });

    it("converts CSV to JSON", async () => {
      const result = await converters.CSV.JSON(csvFile);
      const text = await result.text();
      const json = JSON.parse(text);
      expect(json).toHaveLength(2);
      expect(json[0].name).toBe("John");
    });

    it("converts CSV to XML", async () => {
      const result = await converters.CSV.XML(csvFile);
      const text = await result.text();
      expect(text).toContain("<name>John</name>");
    });

    it("converts CSV to TXT", async () => {
      const result = await converters.CSV.TXT(csvFile);
      const text = await result.text();
      expect(text).toContain("John");
    });
  });

  describe("XML Conversions", () => {
    const xmlContent =
      '<?xml version="1.0" encoding="UTF-8"?><root><item><name>John</name></item></root>';
    const xmlFile = new File([xmlContent], "test.xml", {
      type: "application/xml",
    });

    it("converts XML to JSON", async () => {
      const result = await converters.XML.JSON(xmlFile);
      const text = await result.text();
      const json = JSON.parse(text);
      expect(json.item.name["#text"]).toBe("John");
    });

    it("converts XML to CSV", async () => {
      const result = await converters.XML.CSV(xmlFile);
      const text = await result.text();
      expect(text).toContain("item");
    });
  });

  describe("HTML Conversions", () => {
    const htmlContent = "<html><body><h1>Hello World</h1></body></html>";
    const htmlFile = new File([htmlContent], "test.html", {
      type: "text/html",
    });

    it("converts HTML to TXT", async () => {
      const result = await converters.HTML.TXT(htmlFile);
      const text = await result.text();
      expect(text).toContain("Hello World");
    });

    it("converts HTML to PDF", async () => {
      const result = await converters.HTML.PDF(htmlFile);
      expect(result.type).toBe("application/pdf");
    });

    it("converts HTML to DOCX", async () => {
      const result = await converters.HTML.DOCX(htmlFile);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    });
  });

  describe("PDF Conversions", () => {
    const pdfFile = new File(["fake-pdf-content"], "test.pdf", {
      type: "application/pdf",
    });

    it("converts PDF to TXT", async () => {
      const result = await converters.PDF.TXT(pdfFile);
      const text = await result.text();
      expect(text).toContain("mock pdf text");
    });

    it("converts PDF to HTML", async () => {
      const result = await converters.PDF.HTML(pdfFile);
      const text = await result.text();
      expect(text).toContain("mock pdf text");
      expect(text).toContain("<html><body>");
    });

    it("converts PDF to DOCX", async () => {
      const result = await converters.PDF.DOCX(pdfFile);
      expect(result.type).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      expect(result).toBeInstanceOf(Blob);

      // Verify that docx components were called correctly
      // Paragraph should be called for each line (mock returns "mock pdf text\n")
      expect(Paragraph).toHaveBeenCalled();
      expect(TextRun).toHaveBeenCalled();

      // Check that it was called with an object, not just a string (the reported bug)
      const firstParaCall = vi.mocked(Paragraph).mock.calls[0][0];
      expect(typeof firstParaCall).toBe("object");
      expect(firstParaCall).toHaveProperty("children");

      const firstTextRunCall = vi.mocked(TextRun).mock.calls[0][0];
      expect(typeof firstTextRunCall).toBe("object");
      expect(firstTextRunCall).toHaveProperty("text", "mock pdf text");
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
});
