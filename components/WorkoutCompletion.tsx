import React from 'react';
import { WorkoutSessionResult } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface WorkoutCompletionProps {
  result: WorkoutSessionResult | null;
  onRestart: () => void;
  buttonText?: string;
}

const WorkoutCompletion: React.FC<WorkoutCompletionProps> = ({ result, onRestart, buttonText = "Начать заново" }) => {
  if (!result) return null;
  
  const { completed, skipped, total } = result;

  return (
    <div className="text-center bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-8 sm:p-12 animate-fade-in max-w-lg mx-auto">
      <CheckCircleIcon className="h-20 w-20 text-cyan-500 dark:text-cyan-400 mx-auto" />
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-white mt-6">Тренировка завершена!</h1>
      <p className="text-slate-600 dark:text-gray-300 mt-4 text-lg">Отличная работа! Вы на шаг ближе к цели.</p>
      
      <div className="mt-8 flex justify-around text-center border-t border-b border-slate-200 dark:border-white/10 py-6">
        <div>
          <p className="text-3xl font-bold text-cyan-500 dark:text-cyan-300">{completed}</p>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Выполнено</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-500 dark:text-gray-400">{skipped}</p>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Пропущено</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-700 dark:text-white">{total}</p>
          <p className="text-slate-500 dark:text-gray-400 mt-1 text-sm">Всего</p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mt-8 w-full inline-flex items-center justify-center px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 duration-300"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default WorkoutCompletion;
