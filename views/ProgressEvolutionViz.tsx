import React, { useMemo, useState, useEffect, useRef } from 'react';
import SectionCard from '../../components/SectionCard';
import { useAuth } from '../../hooks/useAuth';
import { CalendarIcon } from '../../components/icons/CalendarIcon';

const MOCK_WORKOUT_HISTORY = [
    // This week (3 sessions)
    { date: new Date().toISOString(), sessions: [{ completed: 8, total: 10, workoutId: 'mock' }, { completed: 9, total: 10, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 10, total: 10, workoutId: 'mock' }] },
    // 1 week ago (5 sessions)
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 12, total: 12, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 10, total: 12, workoutId: 'mock' }, { completed: 11, total: 12, workoutId: 'mock' }, { completed: 12, total: 12, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 8, total: 12, workoutId: 'mock' }] },
    // 2 weeks ago (2 sessions)
    { date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 5, total: 10, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 7, total: 10, workoutId: 'mock' }] },
    // 3 weeks ago (4 sessions)
    { date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 9, total: 10, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 10, total: 10, workoutId: 'mock' }, { completed: 8, total: 10, workoutId: 'mock' }] },
    { date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(), sessions: [{ completed: 9, total: 10, workoutId: 'mock' }] },
];

const Tooltip: React.FC<{ x: number; y: number; label: string; score: number; isMobile: boolean; svgDimensions: { width: number, height: number } }> = ({ x, y, label, score, isMobile, svgDimensions }) => {
    const textRef = useRef<SVGTextElement>(null);
    const [box, setBox] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (textRef.current) {
            const { width, height } = textRef.current.getBBox();
            setBox({ width: width + 24, height: height + 16 });
        }
    }, [label, score]);

    let rectX = isMobile ? x + 10 : x - box.width / 2;
    let rectY = isMobile ? y - box.height / 2 : y - box.height - 10;

    // Boundary checks
    if (rectX < 5) rectX = 5;
    if (rectX + box.width > svgDimensions.width) rectX = svgDimensions.width - box.width - 5;
    if (rectY < 5) rectY = 5;
    if (rectY + box.height > svgDimensions.height) rectY = svgDimensions.height - box.height - 5;

    return (
        <g className="pointer-events-none transition-opacity duration-300 animate-fade-in">
            <rect
                x={rectX}
                y={rectY}
                width={box.width}
                height={box.height}
                rx="8"
                className="fill-slate-800/80 dark:fill-slate-900/80 backdrop-blur-sm"
            />
            <text ref={textRef} x={rectX + box.width / 2} y={rectY + box.height / 2} dy="0.35em" textAnchor="middle" className="text-xs fill-white font-semibold">
                {label}: {score} {score === 1 ? 'тренировка' : (score > 1 && score < 5) ? 'тренировки' : 'тренировок'}
            </text>
        </g>
    );
};

const ProgressEvolutionViz: React.FC = () => {
    const { userData } = useAuth();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

    const weeklyData = useMemo(() => {
        const history = (userData.workoutHistory && userData.workoutHistory.length > 0)
            ? userData.workoutHistory
            : MOCK_WORKOUT_HISTORY;

        const WEEKS_TO_SHOW = 4;
        const weeks = Array.from({ length: WEEKS_TO_SHOW }, () => ({ score: 0 }));
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const msInWeek = 7 * 24 * 60 * 60 * 1000;

        for (const log of history) {
            if (!log || !log.date) continue;
            const logDate = new Date(log.date);
            const weekIndex = Math.floor((today.getTime() - logDate.getTime()) / msInWeek);
            
            if (weekIndex >= 0 && weekIndex < WEEKS_TO_SHOW) {
                weeks[WEEKS_TO_SHOW - 1 - weekIndex].score += log.sessions.length;
            }
        }
        return weeks.map((week, i) => ({
            ...week,
            label: i === WEEKS_TO_SHOW - 1 ? 'Эта неделя' : `${WEEKS_TO_SHOW - 1 - i} нед. назад`
        }));
    }, [userData.workoutHistory]);
    
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width } = entries[0].contentRect;
                const isMobile = width < 640;
                const height = isMobile ? Math.min(width * 1.0, 500) : Math.min(width * 0.6, 350);
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();
    }, []);
    
    const elements = useMemo(() => {
        if (dimensions.width === 0) return null;
        const { width, height } = dimensions;
        const isMobile = width < 640;
        const maxScore = Math.max(1, ...weeklyData.map(w => w.score));

        if (!isMobile) {
            const padding = { top: 40, bottom: 40, left: 10, right: 10 };
            const weekWidth = (width - padding.left - padding.right) / weeklyData.length;
            
            return weeklyData.map((week, i) => {
                const numParticles = Math.min(150, week.score * 10 + 5);
                const cloudRadius = (weekWidth / 3) * (0.4 + (week.score / maxScore) * 0.6);
                const x = padding.left + i * weekWidth + weekWidth / 2;
                const y = height / 2.2;

                const particles = Array.from({length: numParticles}).map((_, j) => {
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * cloudRadius;
                    return { key: j, cx: x + Math.cos(angle) * radius, cy: y + Math.sin(angle) * radius };
                });
                
                return { x, y, particles, ...week, animationDelay: 0.3 + (i * 0.2) };
            });
        } else {
            const padding = { top: 10, bottom: 10, left: 40, right: 40 };
            const weekHeight = (height - padding.top - padding.bottom) / weeklyData.length;
            
             return weeklyData.map((week, i) => {
                const numParticles = Math.min(150, week.score * 10 + 5);
                const cloudRadius = (weekHeight / 2) * (0.5 + (week.score / maxScore) * 0.5);
                const x = width / 2;
                const y = padding.top + i * weekHeight + weekHeight / 2;

                const particles = Array.from({length: numParticles}).map((_, j) => {
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * cloudRadius;
                    return { key: j, cx: x + Math.cos(angle) * radius, cy: y + Math.sin(angle) * radius };
                });
                
                return { x, y, particles, ...week, animationDelay: 0.3 + (i * 0.2) };
            });
        }

    }, [dimensions, weeklyData]);
    
    const handleWeekClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedWeek(prev => (prev === index ? null : index));
    };

    const selectedWeekData = selectedWeek !== null ? elements?.[selectedWeek] : null;

    return (
         <SectionCard title="Эволюция прогресса" icon={<CalendarIcon />} titleClassName="text-xl font-bold">
            <div ref={containerRef} className="w-full h-full cursor-pointer" onClick={() => setSelectedWeek(null)}>
                {dimensions.width > 0 && (
                    <svg width={dimensions.width} height={dimensions.height} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
                        {elements ? elements.map((item, i) => {
                            const isSelected = selectedWeek === i;
                            const isDimmed = selectedWeek !== null && !isSelected;
                            return (
                                <g key={i} onClick={(e) => handleWeekClick(e, i)} className="transition-opacity duration-300" style={{ opacity: isDimmed ? 0.3 : 1 }}>
                                    {item.particles.map(p => (
                                        <circle
                                            key={p.key}
                                            cx={p.cx}
                                            cy={p.cy}
                                            r={1.5 + Math.random() * 2}
                                            className="fill-cyan-400 dark:fill-cyan-300 opacity-80"
                                        />
                                    ))}
                                </g>
                            )
                        }) : (
                            <text x={dimensions.width/2} y={dimensions.height/2} textAnchor="middle" className="text-slate-500 dark:text-gray-400 italic text-sm">
                                Загрузка...
                            </text>
                        )}
                        {selectedWeekData && dimensions && (
                            <Tooltip
                                x={selectedWeekData.x}
                                y={selectedWeekData.y}
                                label={selectedWeekData.label}
                                score={selectedWeekData.score}
                                isMobile={dimensions.width < 640}
                                svgDimensions={dimensions}
                            />
                        )}
                    </svg>
                )}
             </div>
         </SectionCard>
    );
}

export default ProgressEvolutionViz;
