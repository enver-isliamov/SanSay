import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { WorkoutLog } from '../types';

interface ActivityCalendarProps {
  history: WorkoutLog[];
}

const OVERSCAN_DAYS = 60; // Render days in a range of +/- 60 days from today
const DAY_IN_VIEW = 7;
const FRICTION = 0.95;
const MIN_VELOCITY = 0.1;

// Helper to generate the smooth SVG path for the graph
const generateSmoothPath = (
    data: number[],
    dayWidth: number,
    height: number,
    paddingY: number
): { linePath: string; areaPath: string } => {
    const maxVal = Math.max(1, ...data);
    const usableHeight = height - paddingY * 2;
    const width = data.length * dayWidth;

    const points = data.map((value, index) => ({
        x: index * dayWidth + dayWidth / 2,
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
        const length = dayWidth * smoothing;
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

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ history }) => {
    const [translateX, setTranslateX] = useState(0);
    const [dayWidth, setDayWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    const velocity = useRef(0);
    const lastPos = useRef(0);
    const lastTime = useRef(0);

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
        const d = [];
        for (let i = -OVERSCAN_DAYS; i <= OVERSCAN_DAYS; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            d.push(date);
        }
        return { dates: d, todayIndex: OVERSCAN_DAYS };
    }, []);
    
    const scrollerWidth = useMemo(() => dates.length * dayWidth, [dates.length, dayWidth]);
    const minTranslateX = useMemo(() => -scrollerWidth + containerWidth, [scrollerWidth, containerWidth]);

    const stopAnimation = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
    }, []);

    const setBoundedTranslateX = useCallback((newX: number) => {
        setTranslateX(Math.max(minTranslateX, Math.min(0, newX)));
    }, [minTranslateX]);
    
    const animate = useCallback(() => {
        if (Math.abs(velocity.current) < MIN_VELOCITY) {
            stopAnimation();
            return;
        }

        setTranslateX(prevX => {
            const newX = prevX + velocity.current;
            velocity.current *= FRICTION;
            if (newX > 0 || newX < minTranslateX) {
                velocity.current = 0;
                return Math.max(minTranslateX, Math.min(0, newX));
            }
            return newX;
        });

        animationFrameId.current = requestAnimationFrame(animate);
    }, [minTranslateX, stopAnimation]);

    const handleTouchStart = (e: React.TouchEvent) => {
        stopAnimation();
        isDragging.current = true;
        startX.current = e.touches[0].clientX - translateX;
        lastPos.current = translateX;
        lastTime.current = performance.now();
        velocity.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const newTranslateX = currentX - startX.current;

        const now = performance.now();
        const elapsed = now - lastTime.current;
        if (elapsed > 20) { // Update velocity periodically
             const delta = newTranslateX - lastPos.current;
             velocity.current = (delta / elapsed) * 16; // 16ms for ~60fps
             lastPos.current = newTranslateX;
             lastTime.current = now;
        }
        setBoundedTranslateX(newTranslateX);
    };
    
    const handleTouchEnd = () => {
        isDragging.current = false;
        if (Math.abs(velocity.current) > MIN_VELOCITY) {
            animate();
        }
    };
    
    const { chartData, linePath, areaPath } = useMemo(() => {
        const CHART_HEIGHT = 96;
        const PADDING_Y = CHART_HEIGHT * 0.15;
        const data = dates.map(day => {
            const dayData = workoutDataByDate.get(day.toDateString());
            return dayData ? dayData.completed : 0;
        });
        const paths = generateSmoothPath(data, dayWidth, CHART_HEIGHT, PADDING_Y);
        return { chartData: data, ...paths };
    }, [dates, workoutDataByDate, dayWidth]);
    
    const centerDate = useMemo(() => {
        if (!dayWidth) return new Date();
        const centerIndex = Math.round((-translateX + containerWidth / 2) / dayWidth);
        return dates[centerIndex] || new Date();
    }, [translateX, containerWidth, dayWidth, dates]);
    
    const goToToday = useCallback(() => {
        if (!dayWidth || !containerWidth) return;
        stopAnimation();
        const targetX = -todayIndex * dayWidth + (containerWidth - dayWidth) / 2;
        setTranslateX(targetX); // Consider animating this with a spring library later
    }, [dayWidth, containerWidth, todayIndex, stopAnimation]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const resizeObserver = new ResizeObserver(() => {
            const newContainerWidth = el.offsetWidth;
            const newDayWidth = newContainerWidth / DAY_IN_VIEW;
            setContainerWidth(newContainerWidth);
            setDayWidth(newDayWidth);
            const targetX = -todayIndex * newDayWidth + (newContainerWidth - newDayWidth) / 2;
            setTranslateX(targetX);
        });

        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [todayIndex]);

    const todayDate = useMemo(() => {
        const d = new Date();
        d.setHours(0,0,0,0);
        return d.toDateString();
    }, []);

    const getIntensityClass = (value: number): string => {
        if (value === 0) {
            return 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80';
        }
        // Assuming max exercises in a day is around 10 for color scaling
        const percentage = Math.min(100, (value / 10) * 100);
        if (percentage >= 75) return 'bg-cyan-500';
        if (percentage >= 50) return 'bg-cyan-400';
        if (percentage >= 25) return 'bg-cyan-300';
        return 'bg-cyan-200';
    };

    const monthName = centerDate.toLocaleString('ru-RU', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    
    return (
        <div>
            <div className="relative flex justify-center items-center text-center mb-4 h-6">
                <h4 className="font-semibold text-slate-700 dark:text-white">
                  {capitalizedMonth} {centerDate.getFullYear()}
                </h4>
                <button
                    onClick={goToToday}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                >
                    Сегодня
                </button>
            </div>
            <div
                ref={containerRef}
                className="relative overflow-hidden cursor-grab touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div style={{
                    width: scrollerWidth,
                    transform: `translateX(${translateX}px)`,
                    transition: isDragging.current ? 'none' : 'transform 0.1s linear'
                }}>
                    <div className="h-24 mb-4">
                        <svg viewBox={`0 0 ${scrollerWidth} 96`} className="w-full h-full" preserveAspectRatio="none">
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
                    <div className="flex px-1">
                        {dates.map((day, index) => {
                            const isToday = day.toDateString() === todayDate;
                            const value = chartData[index];
                            const cellClass = getIntensityClass(value);
                            const hasWorkout = value > 0;
                            const textColorClass = hasWorkout ? 'text-white' : 'text-slate-500 dark:text-gray-400';
                            return (
                                <div key={day.toISOString()} style={{ width: dayWidth - 3, margin: '0 1.5px' }}
                                    className={`aspect-square rounded-lg transition-all flex items-center justify-center flex-shrink-0 ${cellClass} ${isToday ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900 ring-cyan-400' : ''}`}
                                >
                                    <span className={`text-xs font-bold leading-none ${textColorClass}`}>{day.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>
                     <div className="flex px-1 mt-2">
                         {dates.map(day =>
                            <div key={day.toISOString()} style={{ width: dayWidth - 3, margin: '0 1.5px' }} className="h-5 flex items-center justify-center text-xs text-center text-slate-400 dark:text-gray-400 font-medium flex-shrink-0">
                                {weekDays[day.getDay()]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCalendar;
