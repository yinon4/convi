import { EyeIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef, useState } from "react";

interface FilePreviewProps {
  file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"text" | "image" | "none">(
    "none",
  );
  const [showPreview, setShowPreview] = useState(false);

  // Ref to track current blob URL for cleanup
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup previous URL if it exists
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }

    const mimeType = file.type;

    if (
      mimeType.startsWith("text/") ||
      [
        "application/json",
        "application/xml",
        "text/xml",
        "text/csv",
        "text/tab-separated-values",
        "text/markdown",
        "text/html",
      ].includes(mimeType) ||
      file.name.toLowerCase().endsWith(".md") ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".json") ||
      file.name.toLowerCase().endsWith(".csv") ||
      file.name.toLowerCase().endsWith(".tsv") ||
      file.name.toLowerCase().endsWith(".xml") ||
      file.name.toLowerCase().endsWith(".html")
    ) {
      // Text-based content
      file.text().then((text) => {
        setPreviewContent(
          text.length > 1000 ? text.substring(0, 1000) + "..." : text,
        );
        setPreviewType("text");
      });
    } else if (mimeType.startsWith("image/")) {
      // Image content
      const url = URL.createObjectURL(file);
      currentUrlRef.current = url;
      setPreviewContent(url);
      setPreviewType("image");
    } else {
      setPreviewType("none");
      setPreviewContent(null);
    }

    // Cleanup when component unmounts or file changes
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [file]);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (previewType === "none") {
    return null;
  }

  return (
    <div className="mb-6 w-full">
      <button
        onClick={togglePreview}
        className="gap-2 hover:bg-base-200 mb-4 border-base-300 hover:border-base-content/20 btn-outline w-full btn btn-sm"
        aria-label={showPreview ? "Hide file preview" : "Show file preview"}
        aria-expanded={showPreview}
      >
        <EyeIcon className="w-4 h-4" aria-hidden="true" />
        {showPreview ? "Hide Preview" : "Preview File"}
      </button>

      {showPreview && (
        <div className="bg-base-200 p-4 border border-base-300 rounded-lg">
          {previewType === "text" && (
            <pre className="max-h-48 overflow-y-auto text-sm text-left break-words whitespace-pre-wrap">
              {previewContent}
            </pre>
          )}
          {previewType === "image" && previewContent && (
            <img
              src={previewContent}
              alt="File preview"
              className="mx-auto rounded max-w-full max-h-48 object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default FilePreview;
