import React, { useMemo } from 'react';
import SectionCard from './SectionCard';
import RadarChart from './RadarChart';
import { useAuth } from '../hooks/useAuth';
import { SKILLS, EXERCISE_SKILL_MAP } from '../constants';

const SkillsMapSection: React.FC = () => {
    const { userData } = useAuth();
    const executionHistory = userData.exerciseExecutionHistory || {};

    const chartData = useMemo(() => {
        const rawScores: Record<string, number> = SKILLS.reduce((acc, skill) => ({ ...acc, [skill]: 0 }), {});

        for (const [exerciseName, count] of Object.entries(executionHistory)) {
            const skills = EXERCISE_SKILL_MAP[exerciseName];
            if (skills) {
                skills.forEach(skill => {
                    // Fix: Explicitly cast `count` to `number` to resolve TypeScript error.
                    // The type of `count` can be inferred as `unknown` from `Object.entries`.
                    rawScores[skill] = (rawScores[skill] || 0) + (count as number);
                });
            }
        }
        
        return SKILLS.map(skill => {
            const rawScore = rawScores[skill] || 0;
            // Нормализация: логарифмическая шкала до 10. Позволяет видеть прогресс в начале.
            const value = Math.min(10, Math.log2(rawScore + 1) * 2.5);
            return { skill, value };
        });

    }, [executionHistory]);
    
    const hasData = useMemo(() => chartData.some(d => d.value > 0), [chartData]);

    return (
        <SectionCard title="Карта навыков" titleClassName="text-xl sm:text-2xl">
            {hasData ? (
                 <div className="flex justify-center -m-4 sm:-m-6">
                    <RadarChart data={chartData} />
                 </div>
            ) : (
                <p className="text-slate-500 dark:text-gray-400 text-center italic">
                    Начните тренироваться, чтобы увидеть здесь свою карту навыков.
                </p>
            )}
        </SectionCard>
    );
};

export default SkillsMapSection;
