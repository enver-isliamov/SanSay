
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import ProgramView from './views/ProgramView';
import ProfileView from './views/ProfileView';
import TodayView from './views/TodayView';
import SymptomsView from './views/SymptomsView';
import SpecialProgramView from './views/SpecialProgramView';
import { View } from './types';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  const [view, setView] = useState<View>('today');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderView = () => {
    switch (view) {
      case 'today':
        return <TodayView setView={setView} />;
      case 'program':
        return <ProgramView setView={setView} />;
      case 'specialProgram':
        return <SpecialProgramView setView={setView} />;
      case 'profile':
        return <ProfileView isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
      case 'symptoms':
        return <SymptomsView setView={setView} />;
      default:
        return <TodayView setView={setView} />;
    }
  };

  return (
    <AuthProvider>
      <div className="bg-slate-100 dark:bg-slate-900 min-h-screen font-sans">
        <main className="pb-24">
          {renderView()}
        </main>
        <BottomNav currentView={view} setView={setView} />
      </div>
    </AuthProvider>
  );
};

// Fix: Removed duplicate `export` keyword which caused a syntax error.
export default App;