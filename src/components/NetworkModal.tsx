import { XMarkIcon } from "@heroicons/react/24/outline";
import React from "react";
import { createPortal } from "react-dom";
import { converters } from "../converters";

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NetworkModal: React.FC<NetworkModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = [
    {
      name: "Text",
      formats: ["TXT", "HTML", "MD"],
      description: "Convert between text, HTML, and Markdown formats.",
    },
    {
      name: "Data",
      formats: ["JSON", "CSV", "XML", "TSV"],
      description: "Interchange data formats for developers.",
    },
    {
      name: "Images",
      formats: ["JPG", "PNG", "WEBP", "BMP", "ICO", "GIF"],
      description: "Convert between various image types.",
    },
  ];

  const modalContent = (
    <div
      className="z-[9999] fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in duration-200 cursor-pointer fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-base-100 shadow-2xl p-6 md:p-8 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-in duration-200 cursor-default zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="top-4 right-4 absolute btn btn-ghost btn-circle"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="mb-2 font-black text-2xl tracking-tight">
          Supported Formats
        </h2>
        <p className="mb-8 text-base-content/60">
          We support {Object.keys(converters).length} input formats and dozens
          of conversion paths.
        </p>

        <div className="space-y-6">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="bg-base-200/50 p-5 border border-base-300 rounded-2xl"
            >
              <h3 className="mb-1 font-bold text-lg">{cat.name}</h3>
              <p className="mb-4 text-xs text-base-content/50">
                {cat.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.formats.map((f) => (
                  <div
                    key={f}
                    className="font-bold badge badge-primary badge-lg"
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-base-200 border-t text-center">
          <button
            onClick={onClose}
            className="rounded-xl btn btn-primary btn-wide"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default NetworkModal;
