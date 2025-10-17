import React, { useState, useMemo } from 'react';
import { WorkoutLog } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';


interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const workoutDataByDate = useMemo(() => {
    const map = new Map<string, { completed: number; total: number }>();
    if (Array.isArray(history)) {
      history.forEach(log => {
        if (!log || !log.date || isNaN(new Date(log.date).getTime())) return;
        const date = new Date(log.date);
        const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toDateString();
        
        const dayData = map.get(dateStr) || { completed: 0, total: 0 };
        
        if (Array.isArray(log.sessions)) {
          log.sessions.forEach(session => {
              if (session && typeof session.completed === 'number' && typeof session.total === 'number') {
                dayData.completed += session.completed;
                dayData.total += session.total;
              }
          });
        }
        map.set(dateStr, dayData);
      });
    }
    return map;
  }, [history]);

  const { firstWorkoutMonth, futureLimitMonth } = useMemo(() => {
    const validHistory = Array.isArray(history) ? history.filter(log => log && log.date && !isNaN(new Date(log.date).getTime())) : [];
    
    let firstMonth: Date | null = null;
    if (validHistory.length > 0) {
        const sortedHistory = [...validHistory].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstWorkoutDate = new Date(sortedHistory[0].date);
        firstMonth = new Date(firstWorkoutDate.getFullYear(), firstWorkoutDate.getMonth(), 1);
    }

    const today = new Date();
    const limitMonth = new Date(today.getFullYear(), today.getMonth() + 3, 1);

    return { firstWorkoutMonth: firstMonth, futureLimitMonth: limitMonth };
  }, [history]);

  const dayGrid = useMemo(() => {
    const grid: (Date | null)[] = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
        grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push(new Date(year, month, i));
    }
    return grid;
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getIntensityClass = (date: Date): string => {
    const dayData = workoutDataByDate.get(date.toDateString());
    if (!dayData || dayData.total === 0) {
      return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80';
    }
    const percentage = (dayData.completed / dayData.total) * 100;
    if (percentage > 75) return 'bg-cyan-500';
    if (percentage > 50) return 'bg-cyan-400';
    if (percentage > 25) return 'bg-cyan-300';
    return 'bg-cyan-200';
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isPrevDisabled = firstWorkoutMonth ? (currentDate.getFullYear() <= firstWorkoutMonth.getFullYear() && currentDate.getMonth() <= firstWorkoutMonth.getMonth()) : false;
  const isNextDisabled = currentDate.getFullYear() >= futureLimitMonth.getFullYear() && currentDate.getMonth() >= futureLimitMonth.getMonth();

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <button onClick={handlePrevMonth} disabled={isPrevDisabled} className="p-1 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-white capitalize w-32 text-center">
                {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={handleNextMonth} disabled={isNextDisabled} className="p-1 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </div>
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center">
            {weekDays.map(day => <div key={day} className="text-xs text-slate-400 dark:text-gray-500 font-bold">{day}</div>)}
            
            {dayGrid.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="w-8 h-8"></div>;

                const isToday = day.toDateString() === today.toDateString();
                const cellClass = getIntensityClass(day);

                const dayData = workoutDataByDate.get(day.toDateString());
                const hasWorkout = !!dayData && dayData.total > 0;
                const textColorClass = hasWorkout ? 'text-white' : 'text-slate-500 dark:text-gray-400';

                return (
                    <div
                        key={day.toISOString()}
                        className={`w-8 h-8 rounded-full transition-all flex items-center justify-center text-xs font-medium
                            ${cellClass}
                            ${isToday ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-cyan-400' : ''}
                        `}
                        title={day.toLocaleDateString('ru-RU')}
                    >
                      <span className={textColorClass}>
                        {day.getDate()}
                      </span>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default ActivityCalendar;
