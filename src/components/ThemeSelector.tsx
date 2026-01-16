import { SwatchIcon } from "@heroicons/react/24/outline";
import React from "react";

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

const ThemeSelector: React.FC = () => {
  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle"
        aria-label="Theme Selector"
      >
        <SwatchIcon className="w-6 h-6" />
      </div>
      <div
        tabIndex={0}
        className="z-[2] bg-base-200 shadow-2xl mt-4 p-2 border border-base-300 rounded-box w-64 max-h-[70vh] overflow-y-auto dropdown-content scrollbar-thin scrollbar-thumb-base-content/20 scrollbar-track-base-100"
      >
        <div className="gap-2 grid grid-cols-1 p-2">
          <div className="mb-2 px-2 font-bold text-xs text-base-content/50 uppercase tracking-wider">
            Select Theme
          </div>
          {themes.map((theme) => (
            <input
              key={theme}
              type="radio"
              name="theme-dropdown"
              className="btn-block justify-start content-center px-4 text-left capitalize theme-controller btn btn-sm btn-ghost"
              aria-label={theme}
              value={theme}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
