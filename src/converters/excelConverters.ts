import * as XLSX from "xlsx";

// Excel conversion functions
const excelToCsv = async (file: File): Promise<Blob> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return new Blob([csv], { type: "text/csv" });
  } catch (error) {
    throw new Error(
      "Failed to convert Excel to CSV. Please ensure your Excel file is valid and not password-protected.",
    );
  }
};

const excelToJson = async (file: File): Promise<Blob> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet);
    return new Blob([JSON.stringify(json, null, 2)], {
      type: "application/json",
    });
  } catch (error) {
    throw new Error(
      "Failed to convert Excel to JSON. Please ensure your Excel file is valid and not password-protected.",
    );
  }
};

const csvToExcel = async (file: File): Promise<Blob> => {
  try {
    const text = await file.text();
    const workbook = XLSX.utils.book_new();
    const worksheet = (XLSX.utils as any).csv_to_sheet(text);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    throw new Error(
      "Failed to convert CSV to Excel. Please ensure your CSV file is properly formatted.",
    );
  }
};

const jsonToExcel = async (file: File): Promise<Blob> => {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    const array = Array.isArray(json) ? json : [json];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(array);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  } catch (error) {
    throw new Error(
      "Failed to convert JSON to Excel. Please ensure your JSON file is valid and properly formatted.",
    );
  }
};

export const excelConverters = {
  excelToCsv,
  excelToJson,
  csvToExcel,
  jsonToExcel,
};
