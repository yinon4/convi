import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import React, { forwardRef, useRef, useState } from "react";

interface FileUploadProps {
  onFileChange: (file: File) => void;
  onError?: (error: string) => void;
}

const ACCEPTED_TYPES = [
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/json",
  "text/csv",
  "application/xml",
  "text/xml",
  "text/html",
  "image/bmp",
  "image/x-icon",
  "image/gif",
  "text/tab-separated-values",
  "text/markdown",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ACCEPTED_EXTENSIONS = [
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".bmp",
  ".ico",
  ".gif",
  ".tsv",
  ".md",
  ".xls",
  ".xlsx",
];

const isFileSupported = (file: File): boolean => {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));
  const hasValidExtension = ACCEPTED_EXTENSIONS.includes(extension);
  const hasValidMimeType = ACCEPTED_TYPES.includes(file.type);

  // Accept if either extension or MIME type is valid (but both are checked for better validation)
  return hasValidExtension || hasValidMimeType;
};

const validateFileContent = async (file: File): Promise<boolean> => {
  const extension = file.name
    .toLowerCase()
    .substring(file.name.lastIndexOf("."));

  try {
    // Read first few bytes to validate content
    const slice = file.slice(0, 100);
    const text = await slice.text();

    switch (extension) {
      case ".json": {
        // JSON should start with { or [
        const trimmed = text.trim();
        return trimmed.startsWith("{") || trimmed.startsWith("[");
      }

      case ".xml":
        // XML should start with <
        return text.trim().startsWith("<");

      case ".html":
        // HTML should contain <html or <!DOCTYPE
        return (
          text.toLowerCase().includes("<html") ||
          text.toLowerCase().includes("<!doctype")
        );

      case ".csv":
      case ".tsv":
        // CSV/TSV should contain commas or tabs
        return text.includes(",") || text.includes("\t");

      case ".md":
        // Markdown often starts with # or has markdown-like content
        return text.includes("#") || text.length > 0;

      case ".xls":
      case ".xlsx":
        // Excel files are binary, rely on extension/mime type
        return true;

      case ".txt":
        // TXT files are always valid as long as they have content
        return text.length > 0;

      default:
        // For images and other binary files, rely on extension/mime type
        return true;
    }
  } catch {
    // If we can't read the file, reject it
    return false;
  }
};

const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>((props, ref) => {
  const { onFileChange, onError } = props;
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isFileSupported(file)) {
        const isValidContent = await validateFileContent(file);
        if (isValidContent) {
          onFileChange(file);
        } else {
          onError?.(
            "File content doesn't match the expected format. Please check your file.",
          );
        }
      } else {
        onError?.(
          "Unsupported file type. Please upload a supported file format.",
        );
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (isFileSupported(file)) {
        const isValidContent = await validateFileContent(file);
        if (isValidContent) {
          onFileChange(file);
        } else {
          onError?.(
            "File content doesn't match the expected format. Please check your file.",
          );
        }
      } else {
        onError?.(
          "Unsupported file type. Please upload a supported file format.",
        );
      }
    }
  };

  return (
    <div
      ref={ref}
      className={`relative flex flex-col items-center justify-center w-full min-h-75 border-4 border-dashed rounded-3xl transition-all cursor-pointer group
        ${
          isDragging
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-base-300 hover:border-primary hover:bg-base-200"
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Upload file by dragging and dropping or clicking to browse"
      aria-describedby="file-upload-description"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={`${ACCEPTED_TYPES.join(",")},${ACCEPTED_EXTENSIONS.join(",")}`}
        onChange={handleFileSelect}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center gap-4 p-8 text-center group-hover:scale-110 transition-transform duration-300 pointer-events-none">
        <div
          className={`p-6 rounded-full ${isDragging ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}
        >
          <CloudArrowUpIcon className="w-12 h-12" aria-hidden="true" />
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-2xl leading-tight">
            {isDragging ? "Drop it here!" : "Upload your file"}
          </h3>
          <p
            id="file-upload-description"
            className="mx-auto max-w-xs text-base text-base-content/60 leading-relaxed"
          >
            Drag and drop your file here, or click to browse files.
          </p>
        </div>
      </div>
    </div>
  );
});

export default FileUpload;
