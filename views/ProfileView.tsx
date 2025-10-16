import React from 'react';
import ThemeToggle from '../components/ThemeToggle';
import ProgressView from './ProgressView';
import FeedbackStats from '../components/FeedbackStats';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import SkillsMapSection from '../components/SkillsMapSection';

interface ProfileViewProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isDarkMode, onToggleTheme }) => {
  const { user, signIn, signOut, loading } = useAuth();

  const AuthSection: React.FC = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-6">
          <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex flex-col items-center text-center">
            {user.photoURL && (
                <img src={user.photoURL} alt="User Avatar" className="h-20 w-20 rounded-full mb-4 border-2 border-cyan-500/50" />
            )}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user.displayName}</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-6">{user.email}</p>
            <button
                onClick={signOut}
                className="w-full sm:w-auto px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-200 font-semibold rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
                Выйти
            </button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Сохраните свой прогресс</h2>
        <p className="mt-2 mb-6 text-slate-600 dark:text-gray-300">
          Войдите, чтобы синхронизировать данные между устройствами и не потерять историю тренировок.
        </p>
        <button
          onClick={signIn}
          className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-semibold rounded-full shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <GoogleIcon />
          <span className="ml-3">Войти через Google</span>
        </button>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
      <div className="space-y-10">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6">
            <AuthSection />
        </div>
        
        <SkillsMapSection />
        <ProgressView />
        <FeedbackStats />

        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center">
                <span className="text-slate-700 dark:text-gray-300 font-medium">Тёмная тема</span>
                <ThemeToggle isEnabled={isDarkMode} onToggle={onToggleTheme} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
