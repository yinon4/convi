import { InformationCircleIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useState } from "react";
import NetworkModal from "./NetworkModal";

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title = "Convi" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light-orange");
  }, []);

  return (
    <>
      <header className="top-0 z-50 sticky bg-base-100 shadow-sm backdrop-blur-md px-4 md:px-8 border-base-200 border-b navbar">
        <div className="navbar-start">
          <div className="group flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="12" fill="#ea580c" />
              <g transform="translate(8,8) scale(1.333)">
                <path
                  stroke="#ffffff"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                />
              </g>
            </svg>
            <h1 className="font-black text-2xl tracking-tighter select-none">
              {title.toLowerCase()}
              <span className="inline-block text-primary">.</span>
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
