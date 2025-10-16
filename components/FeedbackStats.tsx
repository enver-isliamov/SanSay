
import React, { useState, useMemo } from 'react';
import SectionCard from './SectionCard';
import { AnnotationIcon } from './icons/AnnotationIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { useAuth } from '../hooks/useAuth';
import { FeedbackRating } from '../types';

type FilterType = 'all' | 'good' | 'hard';

const FeedbackStats: React.FC = () => {
    const { userData } = useAuth();
    const [filter, setFilter] = useState<FilterType>('all');

    const feedback = userData.exerciseFeedback || {};
    const executionHistory = userData.exerciseExecutionHistory || {};

    const { good, hard } = useMemo(() => {
        const good: string[] = [];
        const hard: string[] = [];
        for (const exerciseName in feedback) {
            if (feedback[exerciseName] === 'good') {
                good.push(exerciseName);
            } else if (feedback[exerciseName] === 'hard') {
                hard.push(exerciseName);
            }
        }
        good.sort();
        hard.sort();
        return { good, hard };
    }, [feedback]);
    
    const filteredExercises = useMemo(() => {
        const all = [
            ...good.map(name => ({ name, rating: 'good' as FeedbackRating })), 
            ...hard.map(name => ({ name, rating: 'hard' as FeedbackRating }))
        ];
        all.sort((a, b) => a.name.localeCompare(b.name));

        if (filter === 'good') return good.map(name => ({ name, rating: 'good' as FeedbackRating }));
        if (filter === 'hard') return hard.map(name => ({ name, rating: 'hard' as FeedbackRating }));
        return all;
    }, [filter, good, hard]);

    const hasFeedback = good.length > 0 || hard.length > 0;
    
    const handleFilterClick = (newFilter: 'good' | 'hard') => {
        setFilter(prevFilter => (prevFilter === newFilter ? 'all' : newFilter));
    };

    const filterButtons: { id: 'good' | 'hard'; count: number; icon: React.ReactNode; activeColorClass: string; }[] = [
        { id: 'good', count: good.length, icon: <ThumbsUpIcon className="h-5 w-5" />, activeColorClass: 'text-green-600 dark:text-green-400' },
        { id: 'hard', count: hard.length, icon: <ThumbsDownIcon className="h-5 w-5" />, activeColorClass: 'text-red-600 dark:text-red-400' },
    ];

    return (
        <SectionCard title="Обратная связь" icon={<AnnotationIcon />} titleClassName="text-xl font-bold">
            {hasFeedback ? (
                <div>
                    <div className="flex justify-center mb-6 p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full space-x-1">
                        {filterButtons.map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => handleFilterClick(btn.id)}
                                className={`w-full px-3 py-1.5 text-sm font-semibold rounded-full transition-colors flex items-center justify-center gap-2 ${
                                    filter === btn.id
                                        ? `bg-white dark:bg-slate-900 shadow ${btn.activeColorClass}`
                                        : 'text-slate-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-600/50'
                                }`}
                                aria-label={btn.id === 'good' ? `Показать упражнения, которые помогли (${btn.count})` : `Показать сложные упражнения (${btn.count})`}
                            >
                                {btn.icon}
                                <span className="opacity-70">{btn.count}</span>
                            </button>
                        ))}
                    </div>

                    {filteredExercises.length > 0 ? (
                        <ul className="space-y-2 animate-fade-in">
                            {filteredExercises.map(({ name, rating }) => (
                                <li key={name} className="flex justify-between items-center text-sm text-slate-700 dark:text-gray-200 bg-slate-100/50 dark:bg-white/5 p-3 rounded-lg">
                                    <div className="flex items-center min-w-0">
                                        {rating === 'good' ? (
                                            <ThumbsUpIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                        ) : (
                                            <ThumbsDownIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                                        )}
                                        <span className="truncate pr-2">{name}</span>
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-slate-700/80 px-2 py-1 rounded-full flex-shrink-0">
                                        {executionHistory[name] || 0} раз
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <p className="text-slate-500 dark:text-gray-400 text-center italic py-4">
                            Нет отзывов в этой категории.
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-slate-500 dark:text-gray-400 text-center italic">
                    Оставляйте обратную связь во время тренировок, чтобы увидеть здесь статистику.
                </p>
            )}
        </SectionCard>
    );
};

export default FeedbackStats;
