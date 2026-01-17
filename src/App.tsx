import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import FileUpload from "./components/FileUpload";
import FormatSelector from "./components/FormatSelector";
import Header from "./components/Header";
import ResultArea from "./components/ResultArea";
import SkeletonLoader from "./components/SkeletonLoader";
import { converters, getPossibleOutputs, normalizeFormat } from "./converters";
import { categorizeError, type ErrorInfo } from "./utils/errorHandling";

type AppState = "IDLE" | "CONFIG" | "CONVERTING" | "SUCCESS" | "ERROR";

function App() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);

  // Refs for focus management
  const fileUploadRef = useRef<HTMLDivElement>(null);
  const formatSelectorRef = useRef<HTMLDivElement>(null);
  const convertButtonRef = useRef<HTMLButtonElement>(null);
  const downloadButtonRef = useRef<HTMLButtonElement>(null);
  const errorButtonRef = useRef<HTMLButtonElement>(null);

  // Live region for announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Derived input format
  const rawInputFormat = selectedFile
    ? selectedFile.name.split(".").pop()?.toUpperCase() || ""
    : undefined;

  const inputFormat = rawInputFormat
    ? normalizeFormat(rawInputFormat)
    : undefined;

  // Possible output formats based on input
  const formats = inputFormat ? getPossibleOutputs(inputFormat) : [];

  const getProgressMessage = (progress: number): string => {
    if (progress < 10) return "Starting validation...";
    if (progress < 25) return "Analyzing file...";
    if (progress < 50) return "Preparing conversion...";
    if (progress < 75) return "Converting file...";
    if (progress < 90) return "Finalizing...";
    return "Almost done!";
  };

  // Announce messages to screen readers
  const announceToScreenReader = (message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  };

  // Focus management
  useEffect(() => {
    if (appState === "CONFIG" && formatSelectorRef.current) {
      formatSelectorRef.current.focus();
    } else if (appState === "SUCCESS" && downloadButtonRef.current) {
      downloadButtonRef.current.focus();
    } else if (appState === "ERROR" && errorButtonRef.current) {
      errorButtonRef.current.focus();
    }
  }, [appState]);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setAppState("CONFIG");
    setOutputFormat(""); // Reset output format on new file
    setError(""); // Clear any previous errors
    announceToScreenReader(
      `File selected: ${file.name}, ${file.size} bytes. Please select output format.`,
    );
  };

  const handleFileError = (error: string) => {
    setError(error);
  };

  const handleConvert = async () => {
    if (!selectedFile || !outputFormat) return;

    setAppState("CONVERTING");
    announceToScreenReader(
      `Starting conversion of ${selectedFile.name} to ${outputFormat} format`,
    );
    setProgress(0);

    const updateProgress = (newProgress: number) => {
      setProgress(Math.min(100, Math.max(0, newProgress)));
    };

    try {
      updateProgress(10); // Starting validation

      const file = selectedFile;
      const converter = inputFormat && converters[inputFormat]?.[outputFormat];
      if (!converter) {
        throw new Error(
          `Conversion from ${inputFormat} to ${outputFormat} is not supported. Please try a different format combination.`,
        );
      }

      updateProgress(25); // Converter found, starting conversion

      // Check if this is an image conversion for better progress tracking
      const isImageConversion =
        inputFormat &&
        ["JPG", "PNG", "WEBP", "BMP", "ICO", "GIF"].includes(inputFormat);

      let blob: Blob;
      if (isImageConversion) {
        // For image conversions, use the progress-aware converter
        blob = await converter(file, updateProgress);
      } else {
        // For text conversions, use standard progress updates
        updateProgress(50);
        blob = await converter(file);
        updateProgress(75);
      }

      // Validate output blob
      if (!blob || blob.size === 0) {
        throw new Error(
          "Conversion failed: The output file is empty. Please check your input file and try again.",
        );
      }

      updateProgress(90); // Validation complete, preparing result

      // Store the converted blob for preview/download
      setConvertedBlob(blob);

      updateProgress(100);
      setAppState("SUCCESS");
      announceToScreenReader(
        `Conversion completed successfully. File converted to ${outputFormat} format.`,
      );
    } catch (error) {
      console.error("Conversion failed:", error);

      const errorDetails = categorizeError(error);
      setErrorInfo(errorDetails);
      setError(`${errorDetails.message} ${errorDetails.suggestion}`);
      setAppState("ERROR");
      setProgress(0);
      announceToScreenReader(`Conversion failed: ${errorDetails.message}`);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob || !outputFormat) return;

    const url = URL.createObjectURL(convertedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${outputFormat.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setAppState("IDLE");
    setSelectedFile(null);
    setOutputFormat("");
    setProgress(0);
    setError("");
    setErrorInfo(null);
    setConvertedBlob(null);
  };

  return (
    <div className="flex flex-col bg-base-200 min-h-screen font-sans">
      <Header />

      <main className="flex flex-1 justify-center items-center mx-auto px-4 py-8 md:py-16 max-w-3xl container">
        <div className="w-full">
          {/* IDLE STATE */}
          {appState === "IDLE" && (
            <div className="animate-in duration-500 fade-in zoom-in-95">
              <div className="space-y-6 mb-12 text-center">
                <h2 className="bg-clip-text bg-linear-to-r from-primary to-secondary font-black text-transparent text-4xl md:text-5xl leading-tight">
                  Convert Anything.
                </h2>
                <p className="mx-auto max-w-2xl text-base-content/70 text-lg md:text-xl leading-relaxed">
                  Fast, secure, and free file conversion in your browser.
                </p>
              </div>
              {error && (
                <div className="mb-6 alert alert-error">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span>{error}</span>
                  <button
                    className="hover:scale-110 active:scale-90 transition-all duration-200 btn btn-sm btn-ghost"
                    onClick={() => setError("")}
                    aria-label="Dismiss error message"
                  >
                    <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
              <FileUpload
                ref={fileUploadRef}
                onFileChange={handleFileChange}
                onError={handleFileError}
              />
            </div>
          )}

          {/* CONFIG STATE */}
          {appState === "CONFIG" && selectedFile && (
            <div className="slide-in-from-bottom-8 space-y-8 animate-in duration-500 fade-in">
              <div className="flex items-center gap-4 bg-base-100 shadow-sm p-4 border border-base-300 rounded-2xl">
                <div className="flex justify-center items-center bg-primary/10 rounded-xl w-12 h-12 font-bold text-primary text-lg">
                  {inputFormat}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base truncate leading-tight">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-base-content/60 leading-snug">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="hover:scale-110 active:scale-90 transition-all duration-200 btn btn-ghost btn-circle btn-sm"
                  aria-label="Remove selected file and start over"
                >
                  <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-6 bg-base-100 shadow-xl p-6 md:p-8 rounded-3xl">
                <div>
                  <h3 className="mb-4 font-bold text-xl leading-tight">
                    Select Output Format
                  </h3>
                  <FormatSelector
                    ref={formatSelectorRef}
                    inputFormats={["FILE"]}
                    outputFormats={formats}
                    selectedOutput={outputFormat}
                    onOutputChange={(f) => setOutputFormat(f)}
                    currentInputFormat={inputFormat}
                  />
                </div>

                <div className="divider"></div>

                <button
                  ref={convertButtonRef}
                  className={`btn btn-primary btn-lg w-full gap-3 shadow-primary/30 shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${!outputFormat ? "btn-disabled" : ""}`}
                  onClick={handleConvert}
                  disabled={!outputFormat}
                  aria-label={`Convert file to ${outputFormat} format`}
                >
                  <span className="font-medium text-lg">Convert Now</span>
                  <ArrowRightIcon className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {/* CONVERTING STATE */}
          {appState === "CONVERTING" && (
            <div className="space-y-8 mx-auto py-10 max-w-md text-center animate-in duration-500 fade-in zoom-in-95">
              {progress < 30 ? (
                // Show skeleton loader for first 30% of progress
                <SkeletonLoader type="result" />
              ) : (
                // Show progress indicator after skeleton
                <>
                  <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 border-4 border-base-300 rounded-full"></div>
                    <div
                      className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"
                      style={{ borderRightColor: "transparent" }}
                    ></div>
                    <div className="absolute inset-0 flex justify-center items-center font-bold text-xl">
                      {progress}%
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 font-bold text-2xl leading-tight">
                      {getProgressMessage(progress)}
                    </h3>
                    <p className="text-base text-base-content/60 leading-relaxed">
                      Please wait while we process {selectedFile?.name}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SUCCESS STATE */}
          {appState === "SUCCESS" && (
            <ResultArea
              result={outputFormat}
              blob={convertedBlob}
              onDownload={handleDownload}
              onReset={handleReset}
              downloadButtonRef={downloadButtonRef}
            />
          )}

          {/* ERROR STATE */}
          {appState === "ERROR" && (
            <div className="space-y-8 mx-auto py-10 max-w-md text-center animate-in duration-500 fade-in zoom-in-95">
              <div className="relative mx-auto w-32 h-32">
                <div className="absolute inset-0 border-4 border-error rounded-full"></div>
                <div className="absolute inset-0 flex justify-center items-center">
                  <svg
                    className="w-16 h-16 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-bold text-error text-2xl leading-tight">
                  Conversion Failed
                </h3>
                <p className="mb-6 text-base text-base-content/60 leading-relaxed">
                  {error}
                </p>
                <div className="flex flex-col gap-3 w-full">
                  {errorInfo?.canRetry && (
                    <button
                      ref={errorButtonRef}
                      className="gap-3 shadow-lg shadow-primary/30 w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn btn-primary btn-lg"
                      onClick={handleReset}
                      aria-label="Try converting the file again"
                    >
                      <span className="font-medium text-lg">Try Again</span>
                    </button>
                  )}
                  <button
                    className={`gap-3 w-full hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 btn btn-outline btn-lg ${
                      errorInfo?.canRetry ? 'btn-ghost' : 'btn-primary'
                    }`}
                    onClick={() => {
                      setError("");
                      setErrorInfo(null);
                      setAppState("IDLE");
                      setSelectedFile(null);
                      setOutputFormat("");
                      setConvertedBlob(null);
                    }}
                    aria-label="Choose a different file or format"
                  >
                    <span className="font-medium text-lg">
                      {errorInfo?.canRetry ? 'Try Different File' : 'Choose Different File'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      ></div>

      <footer className="bg-base-200 p-4 text-base-content/40 footer footer-center">
        <aside>
          <p>Copyright © {new Date().getFullYear()} - Convi</p>
          <p>
            <a
              href="https://github.com/yinon4/convi"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-hover"
            >
              View on GitHub
            </a>
          </p>
        </aside>
      </footer>
    </div>
  );
}

export default App;
