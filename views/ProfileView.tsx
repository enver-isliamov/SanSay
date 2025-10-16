import React from 'react';
import ThemeToggle from '../components/ThemeToggle';
import ProgressView from './ProgressView';
import FeedbackStats from '../components/FeedbackStats';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import SkillsMapSection from '../components/SkillsMapSection';
import ActivityCalendar from '../components/ActivityCalendar';
import SectionCard from '../components/SectionCard';

interface ProfileViewProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ isDarkMode, onToggleTheme }) => {
  const { user, signIn, signOut, loading, userData } = useAuth();

  const AuthSection: React.FC = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-[52px]">
          <svg className="animate-spin h-8 w-8 text-cyan-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center justify-between min-h-[52px]">
          <div className="flex items-center min-w-0">
            {user.photoURL && (
                <img src={user.photoURL} alt="User Avatar" className="h-12 w-12 rounded-full mr-4 flex-shrink-0 border-2 border-cyan-500/50" />
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">{user.displayName}</h2>
              <p className="text-sm text-slate-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
              onClick={signOut}
              className="ml-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-200 font-semibold rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm flex-shrink-0"
          >
              Выйти
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between flex-wrap gap-4 min-h-[52px]">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Сохраните свой прогресс</h2>
          <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">
            Войдите, чтобы синхронизировать данные.
          </p>
        </div>
        <button
          onClick={signIn}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-white font-semibold rounded-full shadow-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          <GoogleIcon />
          <span className="ml-2 text-sm">Войти</span>
        </button>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
      <div className="space-y-10">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-grow w-full">
                  <AuthSection />
              </div>
              <div className="w-full sm:w-auto flex-shrink-0 flex items-center justify-between pt-4 sm:pt-0 mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 sm:pl-6 sm:ml-6">
                  <span className="text-slate-700 dark:text-gray-300 font-medium mr-4">Тёмная тема</span>
                  <ThemeToggle isEnabled={isDarkMode} onToggle={onToggleTheme} />
              </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
                <SkillsMapSection />
            </div>
            <div className="lg:col-span-2">
                 <SectionCard title="История Активности" titleClassName="text-xl font-bold">
                    <ActivityCalendar history={userData.workoutHistory || []} />
                </SectionCard>
            </div>
        </div>

        <ProgressView />
        <FeedbackStats />

      </div>
    </div>
  );
};

export default ProfileView;
