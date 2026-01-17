// Text-based conversion functions
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
    throw new Error(
      "Failed to convert JSON to CSV. Please ensure your JSON file is valid and properly formatted.",
    );
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
    throw new Error(
      "Failed to convert JSON to XML. Please ensure your JSON file is valid and properly formatted.",
    );
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
  // Strip HTML tags safely without using innerHTML
  const cleanText = text.replace(/<[^>]*>/g, "").trim();
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

export const textConverters = {
  jsonToCsv,
  csvToJson,
  jsonToXml,
  jsonToTxt,
  txtToJson,
  txtToCsv,
  txtToXml,
  xmlToJson,
  htmlToTxt,
  txtToHtml,
  csvToTsv,
  tsvToCsv,
  mdToHtml,
};
