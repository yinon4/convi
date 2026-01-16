import { MoonIcon, SparklesIcon, SunIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Convi" }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = isDark ? "dark-orange" : "light-orange";
    document.documentElement.setAttribute("data-theme", theme);
  }, [isDark]);

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
      <div className="flex items-center gap-2 navbar-end">
        <label className="swap swap-rotate btn btn-ghost btn-circle">
          <input
            type="checkbox"
            checked={isDark}
            onChange={(e) => setIsDark(e.target.checked)}
          />
          <SunIcon className="w-6 h-6 swap-on" />
          <MoonIcon className="w-6 h-6 swap-off" />
        </label>
      </div>
    </div>
  );
};

export default Header;
