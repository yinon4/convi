import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import React, { forwardRef, useEffect, useRef, useState } from "react";

interface ResultAreaProps {
  result?: string;
  blob?: Blob | null;
  onDownload: () => void;
  onReset: () => void;
  downloadButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

const ResultArea = forwardRef<HTMLDivElement, ResultAreaProps>((props, ref) => {
  const { result, blob, onDownload, onReset, downloadButtonRef } = props;
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

    if (blob && result) {
      const mimeType = blob.type;

      if (
        mimeType.startsWith("text/") ||
        [
          "application/json",
          "application/xml",
          "text/xml",
          "text/csv",
        ].includes(mimeType)
      ) {
        // Text-based content
        blob.text().then((text) => {
          setPreviewContent(
            text.length > 1000 ? text.substring(0, 1000) + "..." : text,
          );
          setPreviewType("text");
        });
      } else if (mimeType.startsWith("image/")) {
        // Image content
        const url = URL.createObjectURL(blob);
        currentUrlRef.current = url;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPreviewContent(url);
         
        setPreviewType("image");
      } else {
        setPreviewType("none");
        setPreviewContent(null);
      }
    } else {
      setPreviewType("none");
      setPreviewContent(null);
    }

    // Cleanup when component unmounts
    return () => {
      if (currentUrlRef.current) {
        URL.revokeObjectURL(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, [blob, result]);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div ref={ref} className="w-full animate-in duration-500 zoom-in-50">
      <div className="relative bg-success shadow-xl overflow-hidden text-success-content card">
        {/* Background Pattern */}
        <div className="top-0 right-0 absolute bg-white/20 blur-3xl -mt-10 -mr-10 rounded-full w-40 h-40"></div>
        <div className="bottom-0 left-0 absolute bg-black/10 blur-3xl -mb-10 -ml-10 rounded-full w-40 h-40"></div>

        <div className="items-center py-12 text-center card-body">
          <div className="bg-white/20 mb-4 p-4 rounded-full ring-4 ring-white/10">
            <CheckIcon className="w-12 h-12" strokeWidth={3} />
          </div>

          <h2 className="mb-3 font-bold text-3xl leading-tight card-title">
            Success!
          </h2>
          <p className="opacity-90 mb-8 max-w-md text-lg leading-relaxed">
            Your file has been successfully converted to{" "}
            <span className="font-bold underline">{result}</span>.
          </p>

          {/* Preview Section */}
          {previewType !== "none" && (
            <div className="mb-6 w-full max-w-md">
              <button
                onClick={togglePreview}
                className="gap-2 hover:bg-white/20 mb-4 border-white/40 hover:border-white/60 btn-outline w-full text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn btn-sm"
                aria-label={
                  showPreview ? "Hide file preview" : "Show file preview"
                }
                aria-expanded={showPreview}
              >
                <EyeIcon className="w-4 h-4" aria-hidden="true" />
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>

              {showPreview && (
                <div className="bg-white/10 backdrop-blur-sm p-4 border border-white/20 rounded-lg">
                  {previewType === "text" && (
                    <pre className="max-h-48 overflow-y-auto text-sm text-left break-words whitespace-pre-wrap">
                      {previewContent}
                    </pre>
                  )}
                  {previewType === "image" && previewContent && (
                    <img
                      src={previewContent}
                      alt="Converted image preview"
                      className="mx-auto rounded max-w-full max-h-48 object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex sm:flex-row flex-col justify-center gap-3 w-full max-w-md">
            <button
              ref={downloadButtonRef}
              onClick={onDownload}
              className="flex-1 gap-2 bg-white hover:bg-white/90 shadow-lg border-none text-success hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn btn-active"
              aria-label={`Download converted ${result} file`}
            >
              <ArrowDownTrayIcon className="w-5 h-5" aria-hidden="true" />
              Download File
            </button>
            <button
              onClick={onReset}
              className="flex-1 gap-2 hover:bg-white/20 border-white/40 hover:border-white/60 btn-outline text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn"
              aria-label="Convert another file"
            >
              <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
              Convert Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ResultArea;
