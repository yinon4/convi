import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Load real test files
const testFiles = {
  txt: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.txt"))],
    "test.txt",
    { type: "text/plain" },
  ),
  json: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.json"))],
    "test.json",
    { type: "application/json" },
  ),
  csv: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.csv"))],
    "test.csv",
    { type: "text/csv" },
  ),
  xml: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.xml"))],
    "test.xml",
    { type: "application/xml" },
  ),
  html: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.html"))],
    "test.html",
    { type: "text/html" },
  ),
  tsv: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.tsv"))],
    "test.tsv",
    { type: "text/tab-separated-values" },
  ),
  md: new File(
    [readFileSync(join(process.cwd(), "test/fixtures/test.md"))],
    "test.md",
    { type: "text/markdown" },
  ),
};

// Mock browser APIs that don't exist in Node.js
if (typeof window !== "undefined") {
  window.URL.createObjectURL = vi.fn(() => "mock-url");
  window.URL.revokeObjectURL = vi.fn();
  // @ts-ignore - Mock for browser environment
  (window as unknown as { DOMMatrix: typeof DOMMatrix }).DOMMatrix =
    class DOMMatrix {};
}

// @ts-ignore - Mock for DOMParser
(globalThis as unknown as { DOMParser: new () => DOMParser }).DOMParser = vi
  .fn()
  .mockImplementation(function () {
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
                {
                  nodeType: 1,
                  nodeName: "name",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "John" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
                {
                  nodeType: 1,
                  nodeName: "age",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "30" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
                {
                  nodeType: 1,
                  nodeName: "city",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "New York" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
              ],
              hasChildNodes: vi.fn().mockReturnValue(true),
            },
            {
              nodeType: 1,
              nodeName: "person",
              attributes: { length: 0 },
              childNodes: [
                {
                  nodeType: 1,
                  nodeName: "name",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "Jane" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
                {
                  nodeType: 1,
                  nodeName: "age",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "25" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
                {
                  nodeType: 1,
                  nodeName: "city",
                  attributes: { length: 0 },
                  childNodes: [
                    { nodeType: 3, nodeName: "#text", nodeValue: "London" },
                  ],
                  hasChildNodes: vi.fn().mockReturnValue(true),
                },
              ],
              hasChildNodes: vi.fn().mockReturnValue(true),
            },
          ];
          // @ts-ignore - Mock childNodes
          childNodes.item = vi
            .fn()
            .mockImplementation((index: number) => childNodes[index]);
          childNodes.length = 2;

          // @ts-ignore - Mock childNodes
          childNodes[0].childNodes[0].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[0].childNodes[0].childNodes[index],
            );
          childNodes[0].childNodes[0].childNodes.length = 1;
          // @ts-ignore - Mock childNodes
          childNodes[0].childNodes[1].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[0].childNodes[1].childNodes[index],
            );
          childNodes[0].childNodes[1].childNodes.length = 1;
          // @ts-ignore - Mock childNodes
          childNodes[0].childNodes[2].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[0].childNodes[2].childNodes[index],
            );
          childNodes[0].childNodes[2].childNodes.length = 1;

          // @ts-ignore - Mock childNodes
          childNodes[1].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[1].childNodes[index],
            );
          childNodes[1].childNodes.length = 3;
          // @ts-ignore - Mock childNodes
          childNodes[1].childNodes[0].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[1].childNodes[0].childNodes[index],
            );
          childNodes[1].childNodes[0].childNodes.length = 1;
          // @ts-ignore - Mock childNodes
          childNodes[1].childNodes[1].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[1].childNodes[1].childNodes[index],
            );
          childNodes[1].childNodes[1].childNodes.length = 1;
          // @ts-ignore - Mock childNodes
          childNodes[1].childNodes[2].childNodes.item = vi
            .fn()
            .mockImplementation(
              (index: number) => childNodes[1].childNodes[2].childNodes[index],
            );
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
    outputPdf: vi
      .fn()
      .mockResolvedValue(
        new Blob(["mock-pdf-content"], { type: "application/pdf" }),
      ),
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
              { str: "It has multiple lines." },
            ],
          }),
        }),
      }),
    }),
  };
});

vi.mock("mammoth", () => ({
  convertToHtml: vi.fn().mockResolvedValue({
    value:
      "<p>Hello World</p><p>This is a test text file.</p><p>It has multiple lines.</p>",
  }),
}));

vi.mock("@ffmpeg/ffmpeg", () => ({
  FFmpeg: vi.fn().mockImplementation(function () {
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
    toBlob: vi.fn().mockResolvedValue(
      new Blob(["mock-docx"], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ),
  },
  Paragraph: vi.fn(),
  TextRun: vi.fn(),
}));

// Import converters AFTER mocks
import { converters } from "./converters";

describe("Converters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("TXT Conversions", () => {
    it("converts TXT to HTML", async () => {
      const result = await converters.TXT.HTML(testFiles.txt);
      const text = await result.text();
      expect(text).toContain("Hello World");
      expect(text).toContain("test text file");
      expect(text).toContain("<html><body><pre>");
    });

    it("converts TXT to JSON", async () => {
      const result = await converters.TXT.JSON(testFiles.txt);
      const text = await result.text();
      expect(text).toContain("Hello World");
    });

    it("converts TXT to CSV", async () => {
      const result = await converters.TXT.CSV(testFiles.txt);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("text/csv");
    });

    it("converts TXT to XML", async () => {
      const result = await converters.TXT.XML(testFiles.txt);
      const text = await result.text();
      expect(text).toContain("<root><text>");
      expect(text).toContain("Hello World");
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

    it("converts XML to TXT", async () => {
      const result = await converters.XML.TXT(testFiles.xml);
      const text = await result.text();
      expect(text).toContain("John");
      expect(text).toContain("30");
    });
  });

  describe("HTML Conversions", () => {
    it("converts HTML to TXT", async () => {
      const result = await converters.HTML.TXT(testFiles.html);
      const text = await result.text();
      expect(text).toContain("Hello World");
      expect(text).toContain("test HTML file");
    });
  });

  describe("TSV Conversions", () => {
    it("converts TSV to CSV", async () => {
      const result = await converters.TSV.CSV(testFiles.tsv);
      const text = await result.text();
      expect(text).toContain("Name,Age,City");
      expect(text).toContain("John,25,New York");
    });

    it("converts TSV to JSON", async () => {
      const result = await converters.TSV.JSON(testFiles.tsv);
      const text = await result.text();
      const json = JSON.parse(text);
      expect(json).toBeInstanceOf(Array);
      expect(json[0]).toHaveProperty("Name", "John");
    });

    it("converts TSV to XML", async () => {
      const result = await converters.TSV.XML(testFiles.tsv);
      const text = await result.text();
      expect(text).toContain("<root>");
      expect(text).toContain("<Name>John</Name>");
    });

    it("converts TSV to TXT", async () => {
      const result = await converters.TSV.TXT(testFiles.tsv);
      const text = await result.text();
      expect(text).toContain("Name\tAge\tCity");
    });
  });

  describe("MD Conversions", () => {
    it("converts MD to HTML", async () => {
      const result = await converters.MD.HTML(testFiles.md);
      const text = await result.text();
      expect(text).toContain("<h1>Test Markdown</h1>");
      expect(text).toContain("<strong>test</strong>");
    });

    it("converts MD to TXT", async () => {
      const result = await converters.MD.TXT(testFiles.md);
      const text = await result.text();
      expect(text).toContain("# Test Markdown");
      expect(text).toContain("**test**");
    });
  });

  describe("Image Conversions", () => {
    it("has all expected conversion methods for JPG", () => {
      const formats = ["PNG", "WEBP", "BMP", "ICO", "GIF"];
      formats.forEach((f) => {
        expect(converters.JPG[f]).toBeDefined();
      });
    });

    it("has all expected conversion methods for PNG", () => {
      const formats = ["JPG", "WEBP", "BMP", "ICO", "GIF"];
      formats.forEach((f) => {
        expect(converters.PNG[f]).toBeDefined();
      });
    });

    it("has all expected conversion methods for GIF", () => {
      const formats = ["JPG", "PNG", "WEBP", "BMP", "ICO"];
      formats.forEach((f) => {
        expect(converters.GIF[f]).toBeDefined();
      });
    });
  });
});
