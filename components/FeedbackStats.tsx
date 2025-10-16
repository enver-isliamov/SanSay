import React, { useState, useMemo } from 'react';
import SectionCard from './SectionCard';
import { AnnotationIcon } from './icons/AnnotationIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { useAuth } from '../hooks/useAuth';
import { FeedbackRating } from '../types';

const FeedbackStats: React.FC = () => {
    const { userData } = useAuth();
    const [isGoodExpanded, setIsGoodExpanded] = useState(false);
    const [isHardExpanded, setIsHardExpanded] = useState(false);

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
        return { good, hard };
    }, [feedback]);

    const hasFeedback = good.length > 0 || hard.length > 0;

    return (
        <SectionCard title="Отзывы об упражнениях" icon={<AnnotationIcon />} titleClassName="text-xl font-bold">
            {hasFeedback ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Good Feedback Card */}
                    <div className="bg-slate-100/50 dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10">
                        <button 
                            onClick={() => setIsGoodExpanded(!isGoodExpanded)} 
                            className="w-full flex justify-between items-center"
                            aria-expanded={isGoodExpanded}
                        >
                            <div className="flex items-center">
                                <ThumbsUpIcon className="h-7 w-7 text-green-500 mr-3" />
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white text-left">Помогло</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">{good.length} упр.</p>
                                </div>
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isGoodExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isGoodExpanded && (
                            <ul className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 animate-fade-in">
                                {good.map(name => (
                                    <li key={name} className="flex justify-between items-center text-sm text-slate-600 dark:text-gray-300">
                                        <span>{name}</span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                            {executionHistory[name] || 0} раз
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    
                    {/* Hard Feedback Card */}
                    <div className="bg-slate-100/50 dark:bg-white/5 p-4 rounded-lg border border-slate-200 dark:border-white/10">
                        <button 
                            onClick={() => setIsHardExpanded(!isHardExpanded)} 
                            className="w-full flex justify-between items-center"
                            aria-expanded={isHardExpanded}
                        >
                             <div className="flex items-center">
                                <ThumbsDownIcon className="h-7 w-7 text-red-500 mr-3" />
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white text-left">Сложно</h3>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">{hard.length} упр.</p>
                                </div>
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform ${isHardExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isHardExpanded && (
                            <ul className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2 animate-fade-in">
                                {hard.map(name => (
                                    <li key={name} className="flex justify-between items-center text-sm text-slate-600 dark:text-gray-300">
                                        <span>{name}</span>
                                        <span className="text-xs font-medium text-slate-500 dark:text-gray-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                            {executionHistory[name] || 0} раз
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
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
