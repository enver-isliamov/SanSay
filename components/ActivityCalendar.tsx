import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const DAY_WIDTH = 48; // Ширина одного дня в пикселях (40px + 8px gap)
const DAYS_TO_RENDER = 60; // Количество дней для рендера в обе стороны от сегодняшнего

// --- Компонент для одного дня ---
const DayColumn: React.FC<{
    date: Date;
    isToday: boolean;
    workoutData?: { completed: number; total: number };
}> = React.memo(({ date, isToday, workoutData }) => {
    const intensity = workoutData && workoutData.total > 0
        ? Math.min(1, workoutData.completed / workoutData.total)
        : 0;

    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    return (
        <div className="flex flex-col items-center justify-end h-full w-10 flex-shrink-0">
            <div 
                className="w-4 rounded-t-md transition-colors bg-cyan-200 dark:bg-cyan-800"
                style={{ height: '2px' }} // Минимальная высота, чтобы всегда было видно
            >
                <div
                    className="w-full bg-cyan-500 rounded-t-md"
                    style={{ height: `${intensity * 100}%` }}
                />
            </div>
            <div
                className={`mt-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                    isToday
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                }`}
            >
                {date.getDate()}
            </div>
            <div className="mt-1 text-xs text-slate-400 dark:text-gray-500">
                {weekDays[date.getDay()]}
            </div>
        </div>
    );
});


// --- Основной компонент календаря ---
const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const offset = useRef(0);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const lastX = useRef(0);
    const velocity = useRef(0);
    const animationFrame = useRef<number | null>(null);

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

    const { dates, todayIndex } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const datesArray: Date[] = [];
        for (let i = -DAYS_TO_RENDER; i <= DAYS_TO_RENDER; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            datesArray.push(d);
        }
        return { dates: datesArray, todayIndex: DAYS_TO_RENDER };
    }, []);

    const setPosition = useCallback((newOffset: number) => {
        if (!contentRef.current) return;
        const minOffset = 0;
        const maxOffset = -(contentRef.current.scrollWidth - (containerRef.current?.clientWidth || 0));
        offset.current = Math.max(maxOffset, Math.min(minOffset, newOffset));
        contentRef.current.style.transform = `translateX(${offset.current}px)`;
    }, []);

    const startInertia = useCallback(() => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        
        const FRICTION = 0.95;
        const tick = () => {
            setPosition(offset.current + velocity.current);
            velocity.current *= FRICTION;

            if (Math.abs(velocity.current) > 0.5) {
                animationFrame.current = requestAnimationFrame(tick);
            } else {
                velocity.current = 0;
            }
        };
        animationFrame.current = requestAnimationFrame(tick);
    }, [setPosition]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        isDragging.current = true;
        startX.current = e.touches[0].clientX;
        lastX.current = startX.current;
        velocity.current = 0;
        if (contentRef.current) {
            contentRef.current.style.transition = 'none';
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const delta = currentX - startX.current;
        const frameDelta = currentX - lastX.current;
        lastX.current = currentX;
        velocity.current = frameDelta;
        setPosition(offset.current + delta);
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        startInertia();
    };
    
    const goToToday = useCallback(() => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        const containerWidth = containerRef.current?.clientWidth || 0;
        const targetOffset = -(todayIndex * DAY_WIDTH - containerWidth / 2 + DAY_WIDTH / 2);
        
        if (contentRef.current) {
             contentRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
             setPosition(targetOffset);
        }
    }, [todayIndex, setPosition]);
    
    // Set initial position
    useEffect(() => {
        goToToday();
    }, [goToToday]);

    const todayDate = useMemo(() => {
        const d = new Date();
        d.setHours(0,0,0,0);
        return d.toDateString();
    }, []);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="w-full h-40 overflow-hidden cursor-grab"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div ref={contentRef} className="flex h-full items-end py-4" style={{ gap: `${DAY_WIDTH - 40}px` }}>
                    {dates.map(date => (
                        <DayColumn
                            key={date.toISOString()}
                            date={date}
                            isToday={date.toDateString() === todayDate}
                            workoutData={workoutDataByDate.get(date.toDateString())}
                        />
                    ))}
                </div>
            </div>
            <button
                onClick={goToToday}
                className="absolute right-0 -top-10 text-xs font-semibold text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors bg-slate-200/60 dark:bg-slate-700/60 px-3 py-1 rounded-full"
            >
                Сегодня
            </button>
        </div>
    );
};

export default ActivityCalendar;
