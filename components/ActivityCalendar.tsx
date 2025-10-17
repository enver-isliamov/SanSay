
import React, { useState, useMemo, useCallback } from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const generateSmoothPath = (
    data: number[],
    width: number,
    height: number,
    paddingY: number
): { linePath: string; areaPath: string } => {
    const maxVal = Math.max(1, ...data);
    const usableHeight = height - paddingY * 2;

    const points = data.map((value, index) => ({
        x: (width / (data.length - 1 || 1)) * index,
        y: height - paddingY - ((value / maxVal) * usableHeight),
    }));

    if (points.length <= 1) {
        const x = points[0]?.x ?? 0;
        const y = points[0]?.y ?? height - paddingY;
        const linePath = `M ${x},${y} L ${x},${y}`;
        const areaPath = `M 0,${height} L ${x},${y} L ${x},${width} L ${width},${height} Z`;
        return { linePath, areaPath };
    }

    const controlPoint = (current: {x:number, y:number}, previous: {x:number, y:number}, next: {x:number, y:number}, reverse = false) => {
        const p = previous || current;
        const n = next || current;
        const smoothing = 0.2;
        const dx = n.x - p.x;
        const dy = n.y - p.y;
        const angle = Math.atan2(dy, dx) + (reverse ? Math.PI : 0);
        const length = Math.sqrt(dx**2 + dy**2) * smoothing;
        const x = current.x + Math.cos(angle) * length;
        const y = current.y + Math.sin(angle) * length;
        return [x, y];
    };

    const lineCommand = (point: {x:number, y:number}, i: number, a: {x:number, y:number}[]) => {
        const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
        const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
        return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point.x},${point.y}`;
    };

    const linePath = points.reduce((acc, point, i, a) =>
        i === 0 ? `M ${point.x},${point.y}` : `${acc} ${lineCommand(point, i, a)}`,
    "");

    const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

    return { linePath, areaPath };
};


const WeekContent: React.FC<{
    displayDate: Date;
    workoutDataByDate: Map<string, { completed: number; total: number }>;
}> = ({ displayDate, workoutDataByDate }) => {
    const weekGrid = useMemo(() => {
        const startDay = new Date(displayDate);
        startDay.setDate(startDay.getDate() - 3);
        startDay.setHours(0, 0, 0, 0);

        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDay);
            day.setDate(startDay.getDate() + i);
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

    const { linePath, areaPath } = useMemo(() => {
        const CHART_WIDTH = 100;
        const CHART_HEIGHT = 40;
        const PADDING_Y = CHART_HEIGHT * 0.15;
        return generateSmoothPath(chartData, CHART_WIDTH, CHART_HEIGHT, PADDING_Y);
    }, [chartData]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    const getIntensityClass = (date: Date): string => {
        const dayData = workoutDataByDate.get(date.toDateString());
        if (!dayData || dayData.completed === 0) {
            return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80';
        }
        const percentage = dayData.total > 0 ? (dayData.completed / dayData.total) * 100 : 100;
        if (percentage >= 75) return 'bg-cyan-500';
        if (percentage >= 50) return 'bg-cyan-400';
        if (percentage >= 25) return 'bg-cyan-300';
        return 'bg-cyan-200';
    };

    return (
        <div>
            <div className="h-24 mb-4">
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" className="text-cyan-500/30 dark:text-cyan-400/30" stopColor="currentColor" />
                            <stop offset="100%" className="text-cyan-500/0 dark:text-cyan-400/0" stopColor="currentColor" stopOpacity="0"/>
                        </linearGradient>
                    </defs>
                    <path fill="url(#chartGradient)" d={areaPath} />
                    <path
                        fill="none"
                        className="stroke-cyan-500 dark:stroke-cyan-400"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={linePath}
                    />
                </svg>
            </div>
            <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                {weekGrid.map((day) => {
                    const isToday = day.toDateString() === today.toDateString();
                    const cellClass = getIntensityClass(day);
                    const dayData = workoutDataByDate.get(day.toDateString());
                    const hasWorkout = !!dayData && dayData.completed > 0;
                    const textColorClass = hasWorkout ? 'text-white' : 'text-slate-500 dark:text-gray-400';
                    return (
                        <div
                            key={day.toISOString()}
                            className={`w-full aspect-square rounded-lg transition-all flex items-center justify-center ${cellClass} ${isToday ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-cyan-400' : ''}`}
                            title={day.toLocaleDateString('ru-RU')}
                        >
                            <span className={`text-xs font-bold leading-none ${textColorClass}`}>{day.getDate()}</span>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-7 gap-1.5 justify-items-center mt-2">
                {weekDays.map(day =>
                    <div key={day} className="w-full h-5 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400 font-medium">
                        {day}
                    </div>
                )}
            </div>
        </div>
    );
};


const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transition, setTransition] = useState<{ date: Date; direction: 'next' | 'prev' } | null>(null);
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

  const changeDay = useCallback((direction: 'next' | 'prev') => {
    if (transition) return;

    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    
    setTransition({ date: newDate, direction });
    
    setTimeout(() => {
        setCurrentDate(newDate);
        setTransition(null);
    }, 300);
  }, [currentDate, transition]);

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    if (currentDate.toDateString() === today.toDateString() || transition) return;

    const direction = today > currentDate ? 'next' : 'prev';
    setTransition({ date: today, direction });
    
    setTimeout(() => {
        setCurrentDate(today);
        setTransition(null);
    }, 300);
  }, [currentDate, transition]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) changeDay('next');
    else if (diff < -50) changeDay('prev');
    setTouchStartX(null);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isTodayVisible = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 3);
    const end = new Date(currentDate);
    end.setDate(end.getDate() + 3);
    return today >= start && today <= end;
  }, [currentDate, today]);

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div>
      <div className="relative flex justify-center items-center text-center mb-4 h-6">
        <h4 className="font-semibold text-slate-700 dark:text-white">
          {capitalizedMonth} {currentDate.getFullYear()}
        </h4>
        {!isTodayVisible && (
            <button
                onClick={handleGoToToday}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors animate-fade-in"
            >
                Сегодня
            </button>
        )}
      </div>
      <div
        className="relative overflow-hidden cursor-grab"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          key={currentDate.getTime()}
          className={transition ? (transition.direction === 'next' ? 'animate-slide-out-right' : 'animate-slide-out-left') : ''}
        >
          <WeekContent displayDate={currentDate} workoutDataByDate={workoutDataByDate} />
        </div>
        {transition && (
           <div 
              key={transition.date.getTime()}
              className={`absolute top-0 left-0 w-full h-full ${transition.direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}
            >
              <WeekContent displayDate={transition.date} workoutDataByDate={workoutDataByDate} />
            </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCalendar;
