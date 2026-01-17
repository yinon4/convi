import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import React from "react";

interface ResultAreaProps {
  result?: string;
  onReset: () => void;
}

const ResultArea: React.FC<ResultAreaProps> = ({
  result,
  onReset,
}) => {
  return (
    <div className="w-full animate-in duration-500 zoom-in-50">
      <div className="relative bg-success shadow-xl overflow-hidden text-success-content card">
        {/* Background Pattern */}
        <div className="top-0 right-0 absolute bg-white/20 blur-3xl -mt-10 -mr-10 rounded-full w-40 h-40"></div>
        <div className="bottom-0 left-0 absolute bg-black/10 blur-3xl -mb-10 -ml-10 rounded-full w-40 h-40"></div>

        <div className="items-center py-12 text-center card-body">
          <div className="bg-white/20 mb-4 p-4 rounded-full ring-4 ring-white/10">
            <CheckIcon className="w-12 h-12" strokeWidth={3} />
          </div>

          <h2 className="mb-2 font-bold text-3xl card-title">
            Success!
          </h2>
          <p className="opacity-90 mb-8 max-w-md text-lg">
            Your file has been
            successfully converted to{" "}
            <span className="font-bold underline">{result}</span>.
          </p>

          <div className="flex sm:flex-row flex-col justify-center gap-3 w-full max-w-md">
            <button className="flex-1 gap-2 bg-white hover:bg-white/90 shadow-lg border-none text-success btn btn-active">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download File
            </button>
            <button
              onClick={onReset}
              className="flex-1 gap-2 hover:bg-white/20 border-white/40 hover:border-white/60 btn-outline text-white btn"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Convert Another
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultArea;
