import React from 'react';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

interface ThemeToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isEnabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-7 w-14 rounded-full transition-colors duration-300 focus:outline-none ${
        isEnabled ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <span className="sr-only">Переключить тему</span>
      <span
        className={`absolute inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          isEnabled ? 'translate-x-8' : 'translate-x-1'
        }`}
      >
        {isEnabled ? (
            <MoonIcon />
        ) : (
            <SunIcon />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
