import React from 'react';
import SectionCard from './SectionCard';
import { RECOVERY_PLAN_DATA } from '../constants';
import { CalendarIcon } from './icons/CalendarIcon';
import { RecoveryStage } from '../types';
import { PlayIcon } from './icons/PlayIcon';

interface RecoveryPlanSectionProps {
    onStartWorkout: (stage: RecoveryStage) => void;
    progressData: Record<number, number>;
}

const RecoveryPlanSection: React.FC<RecoveryPlanSectionProps> = ({ onStartWorkout, progressData }) => {
  return (
    <SectionCard title="Этапы восстановления" icon={<CalendarIcon />}>
      <div className="space-y-8">
        {RECOVERY_PLAN_DATA.map((stage) => {
          const completedCount = progressData[stage.id] || 0;
          const totalDays = stage.totalDays || 0;
          const percentage = totalDays > 0 ? Math.min((completedCount / totalDays) * 100, 100) : 0;

          return (
            <div key={stage.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start border-b border-slate-200 dark:border-white/10 pb-6 last:border-b-0 last:pb-0">
              <div className="md:col-span-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{stage.stage}</h3>
                <p className="text-sm text-cyan-500 dark:text-cyan-400 font-medium">{stage.duration}</p>
                {totalDays > 0 && (
                    <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Прогресс</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-gray-400">{completedCount} / {totalDays} дней</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                )}
              </div>
              <div className="md:col-span-2">
                <p><strong className="font-semibold text-slate-600 dark:text-gray-300">Цель:</strong> {stage.goal}</p>
                <p className="mt-1"><strong className="font-semibold text-slate-600 dark:text-gray-300">Действия:</strong> {stage.actions}</p>
              </div>
              <div className="md:col-span-1 flex justify-start md:justify-end md:items-center md:h-full">
                  <button 
                      onClick={() => onStartWorkout(stage)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-md transition-transform transform hover:scale-105 duration-300 text-sm mt-4 md:mt-0"
                  >
                      <PlayIcon />
                      <span className="ml-2">Начать этап</span>
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default RecoveryPlanSection;