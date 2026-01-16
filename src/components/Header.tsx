import {
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import NetworkModal from "./NetworkModal";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Convi" }) => {
  const [isDark, setIsDark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const theme = isDark ? "dark-orange" : "light-orange";
    document.documentElement.setAttribute("data-theme", theme);
  }, [isDark]);

  return (
    <>
      <header className="top-0 z-50 sticky bg-base-100 shadow-sm backdrop-blur-md px-4 md:px-8 border-base-200 border-b navbar">
        <div className="navbar-start">
          <div className="flex items-center cursor-pointer group gap-2">
            <div className="flex justify-center items-center bg-primary group-hover:rotate-180 rounded-xl w-10 h-10 text-primary-content transition-all duration-700 ease-in-out">
              <ArrowsRightLeftIcon className="w-6 h-6" />
            </div>
            <h1 className="font-black text-2xl tracking-tighter">
              {title.toLowerCase()}
              <span className="group-hover:animate-bounce inline-block text-primary">
                .
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 navbar-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-ghost btn-circle"
            title="See supported conversions"
          >
            <InformationCircleIcon className="w-6 h-6" />
          </button>
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
      </header>
      <NetworkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Header;
