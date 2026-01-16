import { CloudArrowUpIcon } from "@heroicons/react/24/outline";
import React, { useRef, useState } from "react";

interface FileUploadProps {
  onFileChange: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-4 border-dashed rounded-3xl transition-all cursor-pointer group
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
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex flex-col items-center gap-4 p-8 text-center group-hover:scale-110 transition-transform duration-300 pointer-events-none">
        <div
          className={`p-6 rounded-full ${isDragging ? "bg-primary text-primary-content" : "bg-base-300 text-base-content"}`}
        >
          <CloudArrowUpIcon className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-2xl">
            {isDragging ? "Drop it here!" : "Upload your file"}
          </h3>
          <p className="mx-auto max-w-xs text-base-content/60">
            Drag and drop your file here, or click to browse files
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
