import React, { useState, useMemo } from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

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
  
  const dayGrid = useMemo(() => {
    const grid: (Date | null)[] = [];
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday is 0

    for (let i = 0; i < startDay; i++) {
        grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push(new Date(year, month, i));
    }
    // Pad end of grid to ensure it's always a multiple of 7
    while (grid.length % 7 !== 0) {
        grid.push(null);
    }
    return grid;
  }, [currentDate]);

  const chartData = useMemo(() => {
    return dayGrid.map(day => {
        if (!day) return 0;
        const dayData = workoutDataByDate.get(day.toDateString());
        return dayData ? dayData.completed : 0;
    });
  }, [dayGrid, workoutDataByDate]);

  const maxCompleted = useMemo(() => Math.max(1, ...chartData), [chartData]);


  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (diff > 50) { // Swipe left
      goToNextMonth();
    } else if (diff < -50) { // Swipe right
      goToPreviousMonth();
    }

    setTouchStartX(null);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
  }
  
  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div>
      <div className="text-center mb-4">
        <h4 className="font-semibold text-slate-700 dark:text-white">
          {capitalizedMonth} {currentDate.getFullYear()}
        </h4>
      </div>
      <div
        className="cursor-grab"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Activity Chart */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center h-24 items-end pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
            {chartData.map((value, index) => {
                const heightPercentage = value > 0 ? (value / maxCompleted) * 90 + 10 : 0; // Min height 10%
                return (
                    <div key={`bar-${index}`} className="w-5 flex items-end justify-center h-full">
                        <div
                            className="w-full bg-cyan-400 rounded-t-sm transition-all duration-300 ease-out"
                            style={{ height: `${heightPercentage}%` }}
                            title={value > 0 ? `${value} упражнений` : undefined}
                        ></div>
                    </div>
                );
            })}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {dayGrid.map((day, index) => {
                if (!day) return <div key={`blank-${index}`} className="w-5 h-5 rounded-sm"></div>
                
                const isToday = day.toDateString() === today.toDateString();
                const cellClass = getIntensityClass(day);

                const dayData = workoutDataByDate.get(day.toDateString());
                const hasWorkout = !!dayData && dayData.total > 0;
                const textColorClass = hasWorkout
                    ? 'text-white/80'
                    : 'text-slate-400 dark:text-gray-500';

                return (
                    <div
                        key={day.toISOString()}
                        className={`w-5 h-5 rounded-sm transition-all flex items-center justify-center
                            ${cellClass}
                            ${isToday ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-cyan-400' : ''}
                        `}
                        title={day.toLocaleDateString('ru-RU')}
                    >
                      <span className={`text-[9px] font-medium leading-none ${textColorClass}`}>
                        {day.getDate()}
                      </span>
                    </div>
                )
            })}
            {weekDays.map(day => 
                <div 
                    key={day} 
                    className="w-5 h-5 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400 font-medium pt-2">
                    {day}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;
