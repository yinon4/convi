import { ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import React from "react";

interface FormatSelectorProps {
  inputFormats: string[];
  outputFormats: string[];
  selectedOutput: string;
  onOutputChange: (format: string) => void;
  currentInputFormat?: string;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  outputFormats,
  selectedOutput,
  onOutputChange,
  currentInputFormat,
}) => {
  return (
    <div className="slide-in-from-bottom-4 space-y-4 animate-in duration-500 fade-in">
      <div className="flex sm:flex-row flex-col justify-between items-center gap-4 bg-base-200 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-4 font-mono font-bold badge badge-lg badge-neutral">
            {currentInputFormat || "FILE"}
          </div>
          <ArrowRightIcon className="hidden sm:block w-6 h-6 text-base-content/30" />
          <ArrowDownIcon className="sm:hidden w-6 h-6 text-base-content/30" />
          <div className="font-medium text-sm text-base-content/60">
            Convert to:
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {outputFormats.map((format) => (
            <button
              key={format}
              onClick={() => onOutputChange(format)}
              className={`
                btn btn-md rounded-xl transition-all
                ${
                  selectedOutput === format
                    ? "btn-primary shadow-lg scale-105"
                    : "btn-ghost bg-base-100 hover:bg-base-300"
                }
            `}
            >
              {format}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormatSelector;
