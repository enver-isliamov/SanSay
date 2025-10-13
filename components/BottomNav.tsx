import React from 'react';
import { HomeIcon } from './icons/HomeIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UserIcon } from './icons/UserIcon';
import { View } from '../types';
import { BoltIcon } from './icons/BoltIcon';
import { CompassIcon } from './icons/CompassIcon';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const navItems = [
  { id: 'today', label: 'Сегодня', icon: HomeIcon },
  { id: 'program', label: 'Программа', icon: DocumentTextIcon },
  { id: 'specialProgram', label: 'Курс', icon: CompassIcon },
  { id: 'symptoms', label: 'Симптомы', icon: BoltIcon },
  { id: 'profile', label: 'Профиль', icon: UserIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.2)]">
      <div className="container mx-auto px-4 flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col items-center justify-center flex-1 h-16 text-xs transition-colors duration-200 ${
              currentView === item.id
                ? 'text-cyan-500 dark:text-cyan-400'
                // Reduced width from w-16 to allow 5 items
                : 'text-slate-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400'
            }`}
          >
            <div className="w-6 h-6 mb-1">
              <item.icon />
            </div>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;