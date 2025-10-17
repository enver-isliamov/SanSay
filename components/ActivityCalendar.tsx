import React, { useState, useMemo, useCallback } from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const [displayDate, setDisplayDate] = useState(new Date());
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

  const weekGrid = useMemo(() => {
    const startOfWeek = new Date(displayDate);
    const dayOfWeek = startOfWeek.getDay();
    // Adjust to make Monday the first day (getDay() is 0 for Sunday)
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        week.push(day);
    }
    return week;
  }, [displayDate]);

  const chartData = useMemo(() => {
    return weekGrid.map(day => {
        const dayData = workoutDataByDate.get(day.toDateString());
        return dayData ? dayData.completed : 0;
    });
  }, [weekGrid, workoutDataByDate]);

  const maxCompleted = useMemo(() => Math.max(1, ...chartData), [chartData]);

  const goToPreviousWeek = useCallback(() => {
    setDisplayDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 7);
        return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setDisplayDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 7);
        return newDate;
    });
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 50) { // Swipe left
      goToNextWeek();
    } else if (diff < -50) { // Swipe right
      goToPreviousWeek();
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

  const monthName = displayDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const CHART_WIDTH = 100;
  const CHART_HEIGHT = 40;
  const PADDING_Y = CHART_HEIGHT * 0.1; // 10% padding top and bottom
  const USABLE_HEIGHT = CHART_HEIGHT - PADDING_Y * 2;
  
  const chartPoints = chartData.map((value, index) => {
      const x = (CHART_WIDTH / 6) * index;
      const y = CHART_HEIGHT - PADDING_Y - ((value / maxCompleted) * USABLE_HEIGHT);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  const areaPoints = `0,${CHART_HEIGHT} ${chartPoints} ${CHART_WIDTH},${CHART_HEIGHT}`;

  return (
    <div>
      <div className="text-center mb-4">
        <h4 className="font-semibold text-slate-700 dark:text-white">
          {capitalizedMonth} {displayDate.getFullYear()}
        </h4>
      </div>
      <div
        className="cursor-grab"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Line Chart */}
        <div className="h-24 mb-4">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="text-cyan-500/30 dark:text-cyan-400/30" stopColor="currentColor" />
                        <stop offset="100%" className="text-cyan-500/0 dark:text-cyan-400/0" stopColor="currentColor" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <polyline
                    fill="url(#chartGradient)"
                    points={areaPoints}
                />
                <polyline
                    fill="none"
                    className="stroke-cyan-500 dark:stroke-cyan-400"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartPoints}
                />
            </svg>
        </div>

        {/* Calendar Week */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {weekGrid.map((day) => {
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
                        className={`w-full aspect-square rounded-sm transition-all flex items-center justify-center
                            ${cellClass}
                            ${isToday ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-cyan-400' : ''}
                        `}
                        title={day.toLocaleDateString('ru-RU')}
                    >
                      <span className={`text-[10px] sm:text-xs font-medium leading-none ${textColorClass}`}>
                        {day.getDate()}
                      </span>
                    </div>
                )
            })}
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1.5 justify-items-center mt-2">
             {weekDays.map(day =>
                <div
                    key={day}
                    className="w-full h-5 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400 font-medium">
                    {day}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;
