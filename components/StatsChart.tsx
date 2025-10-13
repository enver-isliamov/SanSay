import React, { useMemo } from 'react';
import { WorkoutLog } from '../types';

interface StatsChartProps {
    history: WorkoutLog[];
    variant?: 'full' | 'mini';
}

const StatsChart: React.FC<StatsChartProps> = ({ history, variant = 'full' }) => {
    const weeksToShow = variant === 'mini' ? 4 : 8;

    const weeklyData = useMemo(() => {
        const weeks = Array.from({ length: weeksToShow }, () => 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const msInDay = 1000 * 60 * 60 * 24;
        const startOfThisWeek = new Date(today);
        startOfThisWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));

        history.forEach(log => {
            const logDate = new Date(log.date);
            logDate.setHours(0, 0, 0, 0);

            const diffInMs = startOfThisWeek.getTime() - logDate.getTime();
            const diffInWeeks = Math.floor(diffInMs / (msInDay * 7));

            if (diffInWeeks >= 0 && diffInWeeks < weeksToShow) {
                weeks[weeksToShow - 1 - diffInWeeks] += log.completedWorkouts.length;
            }
        });

        return weeks;
    }, [history, weeksToShow]);

    const maxWorkouts = Math.max(...weeklyData, 1); // Avoid division by zero

    if (variant === 'mini') {
        return (
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Активность</p>
                <div className="flex items-end justify-between h-12 gap-2">
                {weeklyData.map((count, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                        className="w-full bg-cyan-400/50 dark:bg-cyan-500/50 rounded-sm"
                        style={{ height: `${(count / maxWorkouts) * 100}%` }}
                        title={`${count} трен.`}
                    ></div>
                    </div>
                ))}
                </div>
            </div>
        );
    }
    
    // Full variant for Profile page
    return (
        <div className="bg-white/60 dark:bg-white/5 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-white/10 mt-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Активность за {weeksToShow} недель</h3>
            <div className="flex items-end justify-between h-32 gap-2">
                {weeklyData.map((count, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end">
                        <div
                            className="w-full bg-cyan-500 dark:bg-cyan-400 rounded-t-md hover:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors"
                            style={{ height: `${(count / maxWorkouts) * 100}%` }}
                            title={`${count} тренировок`}
                        ></div>
                        <div className="text-xs text-center text-slate-400 dark:text-gray-400 mt-1.5">
                            {weeksToShow - index -1 === 0 ? 'Эта' : `${weeksToShow - index -1}н`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsChart;