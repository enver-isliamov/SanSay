import React, { useState, useEffect, useMemo } from 'react';
import { SPECIAL_PROGRAM_DATA } from '../constants';
import { Workout, WorkoutSessionResult, View, SpecialProgramHistory } from '../types';
import WorkoutPlayer from '../components/WorkoutPlayer';
import WorkoutCompletion from '../components/WorkoutCompletion';
import { PlayIcon } from '../components/icons/PlayIcon';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { useAuth } from '../hooks/useAuth';

const defaultHistory: SpecialProgramHistory = { currentDay: 1, completedToday: false };

const SpecialProgramView: React.FC<{ setView: (view: View) => void }> = ({ setView }) => {
    const { userData, setUserData } = useAuth();
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [finishedWorkoutResult, setFinishedWorkoutResult] = useState<WorkoutSessionResult | null>(null);
    const [openStageId, setOpenStageId] = useState<number | null>(null);

    const history = userData.specialProgramHistory || defaultHistory;

    const { currentStage, currentStageData } = useMemo(() => {
        const day = history.currentDay;
        let stageId = 1;
        if (day >= 8 && day <= 20) stageId = 2;
        if (day >= 21) stageId = 3;
        const stageData = SPECIAL_PROGRAM_DATA.find(s => s.id === stageId);
        return { currentStage: stageId, currentStageData: stageData };
    }, [history.currentDay]);
    
    useEffect(() => {
        setOpenStageId(currentStage);
    }, [currentStage]);


    const handleStartWorkout = () => {
        if (!currentStageData) return;
        
        setActiveWorkout({
            id: `sp-day-${history.currentDay}`,
            title: `День ${history.currentDay}`,
            description: `Тренировка для этапа "${currentStageData.name}"`,
            exercises: currentStageData.exercises,
        });
        setFinishedWorkoutResult(null);
    };

    const handleWorkoutComplete = (result: WorkoutSessionResult) => {
        if (result.completed > 0) {
            const newHistory: SpecialProgramHistory = {
                currentDay: Math.min(30, history.currentDay + 1),
                completedToday: true 
            };
            
            let newExecutionHistory = { ...(userData.exerciseExecutionHistory || {}) };
            if (result.completedExercises) {
                result.completedExercises.forEach(ex => {
                    newExecutionHistory[ex.name] = (newExecutionHistory[ex.name] || 0) + 1;
                });
            }

            setUserData({
                ...userData,
                specialProgramHistory: newHistory,
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

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">🧭 Спецпрограмма</h1>
                <p className="mt-4 text-lg text-cyan-600 dark:text-cyan-300">30-дневный базовый курс</p>
            </header>

            <div className="max-w-3xl mx-auto bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
                <h2 className="font-bold text-slate-800 dark:text-white text-xl mb-2">Ваш прогресс</h2>
                <div className="space-y-2">
                    <p className="text-slate-600 dark:text-gray-300">День: <span className="font-bold text-cyan-500 dark:text-cyan-400">{history.currentDay} / 30</span></p>
                    <p className="text-slate-600 dark:text-gray-300">Текущий этап: <span className="font-bold text-cyan-500 dark:text-cyan-400">{currentStage} / 3</span></p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${(history.currentDay / 30) * 100}%` }}></div>
                    </div>
                </div>
                 <button 
                    onClick={handleStartWorkout}
                    className="w-full mt-6 inline-flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 duration-300"
                >
                    <PlayIcon />
                    <span className="ml-2">Начать тренировку дня {history.currentDay}</span>
                </button>
            </div>
            
            <div className="space-y-4 max-w-3xl mx-auto">
                {SPECIAL_PROGRAM_DATA.map(stage => (
                    <div key={stage.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
                       <button 
                            onClick={() => setOpenStageId(openStageId === stage.id ? null : stage.id)}
                            className="w-full p-6 text-left"
                            aria-expanded={openStageId === stage.id}
                        >
                           <div className="flex justify-between items-start">
                               <h3 className={`text-base font-semibold text-slate-800 dark:text-white pr-4 transition-colors ${openStageId === stage.id ? 'text-cyan-600 dark:text-cyan-400' : ''}`}>
                                   {stage.name}
                               </h3>
                               <div className="flex items-center space-x-2 flex-shrink-0 pt-1">
                                 <p className="text-xs font-medium text-slate-500 dark:text-slate-400 self-end mb-0.5">{stage.duration}</p>
                                 <ChevronDownIcon className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${openStageId === stage.id ? 'rotate-180' : ''}`} />
                               </div>
                           </div>
                       </button>
                       {openStageId === stage.id && (
                           <div className="px-6 pb-6 pt-0 animate-fade-in">
                               <p className="italic text-slate-500 dark:text-gray-400 mb-4 border-t border-slate-200 dark:border-white/10 pt-4">{stage.goal}</p>
                               <ul className="space-y-3 list-disc list-inside text-slate-600 dark:text-gray-300">
                                   {stage.exercises.map(ex => (
                                       <li key={ex.name}>
                                           <strong>{ex.name}:</strong> {ex.reps}
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}
                   </div>
                ))}
            </div>
        </div>
    );
};

export default SpecialProgramView;