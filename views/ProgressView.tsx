import React, { useMemo } from 'react';
import ActivityCalendar from '../components/ActivityCalendar';
import SectionCard from '../components/SectionCard';
import { useAuth } from '../hooks/useAuth';

const ProgressView: React.FC = () => {
    const { userData } = useAuth();
    const history = userData.workoutHistory || [];

    const stats = useMemo(() => {
        if (history.length === 0) {
            return { total: 0, streak: 0, week: 0 };
        }
        
        const uniqueDates = Array.from(new Set(history.map(log => new Date(log.date).toDateString())))
            .map((dateStr: string) => new Date(dateStr))
            .sort((a, b) => b.getTime() - a.getTime());

        let streak = 0;
        if (uniqueDates.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            const mostRecentWorkout = uniqueDates[0];
            if (mostRecentWorkout.getTime() === today.getTime() || mostRecentWorkout.getTime() === yesterday.getTime()) {
                streak = 1;
                let lastDate = mostRecentWorkout;
                for (let i = 1; i < uniqueDates.length; i++) {
                    const currentDate = uniqueDates[i];
                    const diffTime = lastDate.getTime() - currentDate.getTime();
                    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        streak++;
                        lastDate = currentDate;
                    } else {
                        break;
                    }
                }
            }
        }
        
        const todayForWeek = new Date();
        todayForWeek.setHours(0, 0, 0, 0);
        const dayOfWeek = todayForWeek.getDay();
        const startOfWeek = new Date(todayForWeek.setDate(todayForWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))); // Monday

        const weekWorkouts = history
            .filter(h => {
                const workoutDate = new Date(h.date);
                workoutDate.setHours(0,0,0,0);
                return workoutDate >= startOfWeek;
            })
            .reduce((total, log) => total + log.completedWorkouts.length, 0);

        const totalWorkouts = history.reduce((total, log) => total + log.completedWorkouts.length, 0);

        return { total: totalWorkouts, streak, week: weekWorkouts };
    }, [history]);


    return (
        <div className="animate-fade-in">
            <SectionCard title="Статистика" className="mb-6">
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-4xl sm:text-5xl font-bold text-cyan-500 dark:text-cyan-300">{stats.total}</p>
                        <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm sm:text-base">Всего</p>
                    </div>
                    <div className="h-16 w-px bg-slate-200 dark:bg-white/10"></div>
                     <div>
                        <p className="text-4xl sm:text-5xl font-bold text-cyan-500 dark:text-cyan-300">{stats.streak}</p>
                        <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm sm:text-base">Серия</p>
                    </div>
                    <div className="h-16 w-px bg-slate-200 dark:bg-white/10"></div>
                     <div>
                        <p className="text-4xl sm:text-5xl font-bold text-cyan-500 dark:text-cyan-300">{stats.week}</p>
                        <p className="text-slate-500 dark:text-gray-400 mt-2 text-sm sm:text-base">За неделю</p>
                    </div>
                </div>
            </SectionCard>

            <ActivityCalendar history={history} />
        </div>
    );
};

export default ProgressView;
