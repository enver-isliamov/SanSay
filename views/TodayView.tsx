import React, { useState, useEffect, useMemo } from 'react';
import { TODAY_WORKOUT, RECOVERY_PLAN_DATA } from '../constants';
import { Workout, WorkoutSessionResult, View, RecoveryStage, WorkoutLog, WorkoutSessionLog } from '../types';
import WorkoutPlayer from '../components/WorkoutPlayer';
import WorkoutCompletion from '../components/WorkoutCompletion';
import SectionCard from '../components/SectionCard';
import { PlayIcon } from '../components/icons/PlayIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { ArrowPathIcon } from '../components/icons/ArrowPathIcon';
import { useAuth } from '../hooks/useAuth';

const WORKOUT_STATE_KEY = 'workoutPlayerState';

interface TodayViewProps {
    setView: (view: View) => void;
}

const TodayView: React.FC<TodayViewProps> = ({ setView }) => {
    const { userData, setUserData } = useAuth();
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [finishedWorkoutResult, setFinishedWorkoutResult] = useState<WorkoutSessionResult | null>(null);
    const [pendingWorkoutState, setPendingWorkoutState] = useState<{ exerciseIndex: number; totalExercises: number } | null>(null);

    const history = userData.workoutHistory || [];
    const programProgress = userData.mainProgramHistory || {};

    const hasCompletedToday = useMemo(() => {
        const today = new Date().toDateString();
        return !!history.find(log => new Date(log.date).toDateString() === today);
    }, [history]);

    useEffect(() => {
        if (!hasCompletedToday) {
            try {
                const savedStateJSON = localStorage.getItem(WORKOUT_STATE_KEY);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    if (savedState.workoutId === TODAY_WORKOUT.id) {
                        setPendingWorkoutState({
                            exerciseIndex: savedState.currentExerciseIndex + 1,
                            totalExercises: TODAY_WORKOUT.exercises.length
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to parse workout state", error);
            }
        }
    }, [hasCompletedToday]);
    
    const currentStageInfo = useMemo(() => {
        let currentStage: RecoveryStage | null = null;
        for (const stage of RECOVERY_PLAN_DATA) {
            if (stage.totalDays) {
                const completedDays = programProgress[stage.id] || 0;
                if (completedDays < stage.totalDays) {
                    currentStage = stage;
                    break;
                }
            }
        }
        if (!currentStage) {
            currentStage = RECOVERY_PLAN_DATA[RECOVERY_PLAN_DATA.length - 1];
        }
        
        const completedDays = programProgress[currentStage.id] || 0;
        const totalDays = currentStage.totalDays || 0;
        const percentage = totalDays > 0 ? Math.min((completedDays / totalDays) * 100, 100) : 100;

        return {
            stage: currentStage,
            completedDays,
            totalDays,
            percentage
        };
    }, [programProgress]);

    const streak = useMemo(() => {
        if (history.length === 0) return 0;

        const uniqueDates = Array.from(new Set(history.map(log => new Date(log.date).toDateString())))
            .map((dateStr: string) => new Date(dateStr))
            .sort((a, b) => b.getTime() - a.getTime());

        if (uniqueDates.length === 0) return 0;
        
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const mostRecentWorkout = uniqueDates[0];
        if (mostRecentWorkout.getTime() === today.getTime() || mostRecentWorkout.getTime() === yesterday.getTime()) {
            currentStreak = 1;
            let lastDate = mostRecentWorkout;
            for (let i = 1; i < uniqueDates.length; i++) {
                const currentDate = uniqueDates[i];
                const diffTime = lastDate.getTime() - currentDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentStreak++;
                    lastDate = currentDate;
                } else {
                    break;
                }
            }
        }
        return currentStreak;
    }, [history]);

    const handleStartWorkout = () => {
        setActiveWorkout(TODAY_WORKOUT);
        setFinishedWorkoutResult(null);
    };

    const handleRestartWorkout = () => {
        localStorage.removeItem(WORKOUT_STATE_KEY);
        setPendingWorkoutState(null);
        handleStartWorkout();
    };

    const handleWorkoutComplete = (result: WorkoutSessionResult) => {
        setPendingWorkoutState(null);
        if (result.completed > 0) {
            const today = new Date();
            const todayString = today.toDateString();
            
            const newSessionLog: WorkoutSessionLog = {
                workoutId: TODAY_WORKOUT.id,
                completed: result.completed,
                total: result.total,
            };

            // Update workout history
            const newHistory = [...history];
            const todayLogIndex = newHistory.findIndex(log => new Date(log.date).toDateString() === todayString);

            if (todayLogIndex > -1) {
                newHistory[todayLogIndex].sessions.push(newSessionLog);
            } else {
                newHistory.push({
                    date: today.toISOString(),
                    sessions: [newSessionLog]
                });
            }
            
            // Update program progress
            let newProgramProgress = { ...programProgress };
            if (currentStageInfo.stage && currentStageInfo.stage.id) {
                const stageId = currentStageInfo.stage.id;
                newProgramProgress = {
                    ...programProgress,
                    [stageId]: (programProgress[stageId] || 0) + 1,
                };
            }
            
            // Update exercise execution history
            let newExecutionHistory = { ...userData.exerciseExecutionHistory };
            if (result.completedExercises) {
                result.completedExercises.forEach(ex => {
                    newExecutionHistory[ex.name] = (newExecutionHistory[ex.name] || 0) + 1;
                });
            }

            setUserData({
                ...userData,
                workoutHistory: newHistory,
                mainProgramHistory: newProgramProgress,
                exerciseExecutionHistory: newExecutionHistory
            });
        }
        setActiveWorkout(null);
        setFinishedWorkoutResult(result);
    };
    
    const handleCloseCompletion = () => {
        setFinishedWorkoutResult(null);
    };

    if (activeWorkout) {
        return <WorkoutPlayer workout={activeWorkout} onComplete={handleWorkoutComplete} />;
    }
    
    if (finishedWorkoutResult) {
        return (
          <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <WorkoutCompletion result={finishedWorkoutResult} onRestart={handleCloseCompletion} buttonText="Отлично!" />
          </div>
        );
    }

    const totalMinutes = Math.ceil(TODAY_WORKOUT.exercises.reduce((acc, ex) => acc + (ex.duration || ex.hold || 0) * (ex.sets || 1), 0) / 60);

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
            <header className="text-center mb-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Сегодня</h1>
            </header>

            <div className="space-y-8 max-w-2xl mx-auto">
                <SectionCard title="Ваша сводка">
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 dark:text-gray-400 text-sm">Серия</span>
                            <p className="text-2xl font-bold text-cyan-500 dark:text-cyan-400">🔥 {streak} {streak > 1 ? 'дня' : 'день'}</p>
                        </div>
                        <div>
                             <p className="text-sm text-slate-500 dark:text-gray-400 mb-2">Текущий этап: <span className="font-semibold text-slate-700 dark:text-white">{currentStageInfo.stage.stage}</span></p>
                            {currentStageInfo.totalDays > 0 && (
                                <>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${currentStageInfo.percentage}%` }}></div>
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs font-medium text-slate-500 dark:text-gray-400">{currentStageInfo.completedDays} / {currentStageInfo.totalDays} дней</span>
                                </div>
                                </>
                            )}
                        </div>
                    </div>
                </SectionCard>

                <div className={`bg-white/60 dark:bg-white/5 backdrop-blur-md border ${hasCompletedToday ? 'border-green-400/50 dark:border-green-500/50' : 'border-slate-200 dark:border-white/10'} rounded-2xl shadow-lg p-6 transition-all`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        {hasCompletedToday ? (
                            <>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Тренировка выполнена!</h2>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                        Отличная работа. Возвращайтесь завтра!
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setView('profile')}
                                    className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center justify-center text-green-600 dark:text-green-400 font-semibold py-3 px-6 rounded-full bg-green-100 dark:bg-green-900/50 transition-colors hover:bg-green-200 dark:hover:bg-green-900"
                                >
                                    <CheckCircleIcon className="h-6 w-6" />
                                    <span className="ml-2">Прогресс</span>
                                </button>
                            </>
                        ) : pendingWorkoutState ? (
                            <>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Продолжить тренировку</h2>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                        Вы остановились на упр. {pendingWorkoutState.exerciseIndex} из {pendingWorkoutState.totalExercises}.
                                    </p>
                                </div>
                                <div className="w-full sm:w-auto flex flex-col sm:flex-row-reverse items-center gap-3 mt-4 sm:mt-0">
                                     <button 
                                        onClick={handleStartWorkout}
                                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 duration-300"
                                    >
                                        <PlayIcon />
                                        <span className="ml-2">Продолжить</span>
                                    </button>
                                    <button 
                                        onClick={handleRestartWorkout}
                                        className="w-full sm:w-auto flex items-center justify-center text-slate-600 dark:text-gray-300 font-semibold py-3 px-5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 transition-colors hover:bg-slate-300 dark:hover:bg-slate-700"
                                    >
                                        <ArrowPathIcon className="h-5 w-5" />
                                        <span className="ml-2">Заново</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{TODAY_WORKOUT.title}</h2>
                                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                                        {TODAY_WORKOUT.exercises.length} упражнений • ~{totalMinutes} мин.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleStartWorkout}
                                    className="w-full sm:w-auto mt-4 sm:mt-0 inline-flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 duration-300"
                                >
                                    <PlayIcon />
                                    <span className="ml-2">Начать</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodayView;
