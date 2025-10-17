import React, { useState } from 'react';
import RecoveryPlanSection from '../components/RecoveryPlanSection';
import ExercisesSection from '../components/ExercisesSection';
import RecommendationsSection from '../components/RecommendationsSection';
import SummarySection from '../components/SummarySection';
import { ALL_EXERCISES, STAGE_WORKOUTS } from '../constants';
import { Exercise, RecoveryStage, View, Workout, WorkoutSessionResult, WorkoutSessionLog } from '../types';
import WorkoutPlayer from '../components/WorkoutPlayer';
import WorkoutCompletion from '../components/WorkoutCompletion';
import { useAuth } from '../hooks/useAuth';

interface ProgramViewProps {
    setView: (view: View) => void;
}

const ProgramView: React.FC<ProgramViewProps> = ({ setView }) => {
    const { userData, setUserData } = useAuth();
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
    const [finishedWorkoutResult, setFinishedWorkoutResult] = useState<WorkoutSessionResult | null>(null);
    
    const progress = userData.mainProgramHistory || {};

    const handleStartWorkout = (stage: RecoveryStage) => {
        const exerciseNames = STAGE_WORKOUTS[stage.id];
        if (!exerciseNames) return;

        const exercises = exerciseNames
            .map(name => ALL_EXERCISES.find(ex => ex.name === name))
            .filter((ex): ex is Exercise => ex !== undefined);
        
        if (exercises.length > 0) {
            setActiveWorkout({
                id: `stage-${stage.id}`,
                title: `Этап ${stage.id}: ${stage.stage}`,
                description: stage.goal,
                exercises,
            });
            setFinishedWorkoutResult(null);
        }
    };

    const handleWorkoutComplete = (result: WorkoutSessionResult) => {
        if (result.completed > 0 && activeWorkout) {
            const today = new Date();
            const todayString = today.toDateString();

            // Update workout history for activity calendar
            const newSessionLog: WorkoutSessionLog = {
                workoutId: activeWorkout.id,
                completed: result.completed,
                total: result.total,
            };
            const newHistory = [...(userData.workoutHistory || [])];
            const todayLogIndex = newHistory.findIndex(log => log && new Date(log.date).toDateString() === todayString);

            if (todayLogIndex > -1) {
                // FIX: Ensure the sessions array exists and is an array before pushing to it.
                if (!Array.isArray(newHistory[todayLogIndex].sessions)) {
                    newHistory[todayLogIndex].sessions = [];
                }
                newHistory[todayLogIndex].sessions.push(newSessionLog);
            } else {
                newHistory.push({ date: today.toISOString(), sessions: [newSessionLog] });
            }

            // Update main program progress
            let newProgress = progress;
            if (activeWorkout?.id.startsWith('stage-')) {
                const stageId = parseInt(activeWorkout.id.replace('stage-', ''), 10);
                newProgress = {
                    ...progress,
                    [stageId]: (progress[stageId] || 0) + 1,
                };
            }
            
            // Update exercise execution history
            let newExecutionHistory = { ...(userData.exerciseExecutionHistory || {}) };
            if (result.completedExercises) {
                result.completedExercises.forEach(ex => {
                    newExecutionHistory[ex.name] = (newExecutionHistory[ex.name] || 0) + 1;
                });
            }
            
            setUserData({
                ...userData,
                workoutHistory: newHistory,
                mainProgramHistory: newProgress,
                exerciseExecutionHistory: newExecutionHistory,
            });
        }

        setActiveWorkout(null);
        setFinishedWorkoutResult(result);
    };

    const handleCloseCompletion = () => {
        setFinishedWorkoutResult(null);
        setView('today');
    };

    if (activeWorkout) {
        return <WorkoutPlayer workout={activeWorkout} onComplete={handleWorkoutComplete} />;
    }
    
    if (finishedWorkoutResult) {
        return (
          <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex items-center justify-center min-h-[calc(100vh-6rem)]">
            <WorkoutCompletion result={finishedWorkoutResult} onRestart={handleCloseCompletion} buttonText="На главный экран" />
          </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
            <header className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Программа упражнений</h1>
                <p className="mt-4 text-lg text-cyan-600 dark:text-cyan-300">Ваш полный комплекс для восстановления</p>
            </header>
            
            <div className="space-y-10">
                <RecoveryPlanSection onStartWorkout={handleStartWorkout} progressData={progress} />
                <ExercisesSection />
                <RecommendationsSection />
                <SummarySection />
            </div>
        </div>
    );
};

export default ProgramView;
