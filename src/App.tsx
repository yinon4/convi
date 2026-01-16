import { ArrowRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import FileUpload from "./components/FileUpload";
import FormatSelector from "./components/FormatSelector";
import Header from "./components/Header";
import ResultArea from "./components/ResultArea";
// Removed ConvertButton import as it is now integrated into the flow

type AppState = "IDLE" | "CONFIG" | "CONVERTING" | "SUCCESS";

function App() {
  const [appState, setAppState] = useState<AppState>("IDLE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("");
  const [progress, setProgress] = useState(0);

  // Derived input format
  const inputFormat = selectedFile
    ? selectedFile.name.split(".").pop()?.toUpperCase()
    : "";

  // Mock formats list
  const formats = ["PDF", "DOCX", "TXT", "JPG", "PNG", "WEBP"].filter(
    (f) => f !== inputFormat,
  );

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setAppState("CONFIG");
    setOutputFormat(""); // Reset output format on new file
  };

  const handleConvert = () => {
    if (!selectedFile || !outputFormat) return;

    setAppState("CONVERTING");
    setProgress(0);

    // Mock conversion progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAppState("SUCCESS");
          return 100;
        }
        return prev + 5; // increment progress
      });
    }, 100);
  };

  const handleReset = () => {
    setAppState("IDLE");
    setSelectedFile(null);
    setOutputFormat("");
    setProgress(0);
  };

  return (
    <div className="flex flex-col bg-base-200 min-h-screen font-sans">
      <Header />

      <main className="flex flex-1 justify-center items-center mx-auto px-4 py-8 md:py-16 max-w-3xl container">
        <div className="w-full">
          {/* IDLE STATE */}
          {appState === "IDLE" && (
            <div className="animate-in duration-500 fade-in zoom-in-95">
              <div className="space-y-4 mb-10 text-center">
                <h2 className="bg-clip-text bg-gradient-to-r from-primary to-secondary font-black text-transparent text-4xl md:text-5xl">
                  Convert Anything.
                </h2>
                <p className="text-base-content/70 text-lg">
                  Fast, secure, and free file conversion in your browser.
                </p>
              </div>
              <FileUpload onFileChange={handleFileChange} />
            </div>
          )}

          {/* CONFIG STATE */}
          {appState === "CONFIG" && selectedFile && (
            <div className="slide-in-from-bottom-8 space-y-8 animate-in duration-500 fade-in">
              <div className="flex items-center gap-4 bg-base-100 shadow-sm p-4 border border-base-300 rounded-2xl">
                <div className="flex justify-center items-center bg-primary/10 rounded-xl w-12 h-12 font-bold text-primary">
                  {inputFormat}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{selectedFile.name}</h3>
                  <p className="text-xs text-base-content/60">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="btn btn-ghost btn-circle btn-sm"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 bg-base-100 shadow-xl p-6 md:p-8 rounded-3xl">
                <div>
                  <h3 className="mb-4 font-bold text-xl">
                    Select Output Format
                  </h3>
                  <FormatSelector
                    inputFormats={["FILE"]}
                    outputFormats={formats}
                    selectedOutput={outputFormat}
                    onOutputChange={(f) => setOutputFormat(f)}
                    currentInputFormat={inputFormat}
                  />
                </div>

                <div className="divider"></div>

                <button
                  className={`btn btn-primary btn-lg w-full gap-3 shadow-primary/30 shadow-lg ${!outputFormat ? "btn-disabled" : ""}`}
                  onClick={handleConvert}
                  disabled={!outputFormat}
                >
                  <span className="text-lg">Convert Now</span>
                  <ArrowRightIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* CONVERTING STATE */}
          {appState === "CONVERTING" && (
            <div className="space-y-8 mx-auto py-10 max-w-md text-center animate-in duration-500 fade-in zoom-in-95">
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
                <h3 className="mb-2 font-bold text-2xl">
                  Converting your file...
                </h3>
                <p className="text-base-content/60">
                  Please wait while we process {selectedFile?.name}
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {appState === "SUCCESS" && (
            <ResultArea result={outputFormat} onReset={handleReset} />
          )}
        </div>
      </main>

      <footer className="bg-base-200 p-4 text-base-content/40 footer footer-center">
        <aside>
          <p>Copyright © {new Date().getFullYear()} - Convi</p>
        </aside>
      </footer>
    </div>
  );
}

export default App;
