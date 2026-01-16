import { SparklesIcon } from "@heroicons/react/24/outline";
import React from "react";
import ThemeSelector from "./ThemeSelector";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Convi" }) => {
  return (
    <div className="top-0 z-50 sticky bg-base-100/80 shadow-sm backdrop-blur-md px-4 md:px-8 navbar">
      <div className="navbar-start">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl text-primary-content">
            <SparklesIcon className="w-6 h-6" />
          </div>
          <h1 className="font-black text-base-content text-2xl tracking-tight">
            {title}
          </h1>
        </div>
      </div>
      <div className="navbar-end">
        <ThemeSelector />
      </div>
    </div>
  );
};

export default Header;
