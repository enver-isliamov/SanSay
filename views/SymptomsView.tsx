import React, { useState } from 'react';
import { SYMPTOMS_DATA, SYMPTOM_WORKOUTS, ALL_EXERCISES } from '../constants';
import { Workout, WorkoutSessionResult, Exercise, View, WorkoutSessionLog } from '../types';
import WorkoutPlayer from '../components/WorkoutPlayer';
import WorkoutCompletion from '../components/WorkoutCompletion';
import { PlayIcon } from '../components/icons/PlayIcon';
import { useAuth } from '../hooks/useAuth';

interface SymptomsViewProps {
  setView: (view: View) => void;
}

const SymptomsView: React.FC<SymptomsViewProps> = ({ setView }) => {
  const { userData, setUserData } = useAuth();
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [finishedWorkout, setFinishedWorkout] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<WorkoutSessionResult | null>(null);

  const handleStartSymptomWorkout = (symptomName: string) => {
    const exerciseNames = SYMPTOM_WORKOUTS[symptomName];
    if (!exerciseNames) return;
    
    const exercises = exerciseNames
      .map(name => ALL_EXERCISES.find(ex => ex.name === name))
      .filter((ex): ex is Exercise => ex !== undefined);
    
    if (exercises.length > 0) {
        setActiveWorkout({
            id: `symptom-${symptomName.replace(/\s/g, '-')}`,
            title: `Тренировка: ${symptomName}`,
            description: `Целевые упражнения для облегчения "${symptomName}".`,
            exercises,
        });
        setFinishedWorkout(false);
    }
  };

  const handleComplete = (result: WorkoutSessionResult) => {
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
        const todayLogIndex = newHistory.findIndex(log => new Date(log.date).toDateString() === todayString);

        if (todayLogIndex > -1) {
            newHistory[todayLogIndex].sessions.push(newSessionLog);
        } else {
            newHistory.push({ date: today.toISOString(), sessions: [newSessionLog] });
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
            exerciseExecutionHistory: newExecutionHistory
        });
    }

    setActiveWorkout(null);
    setFinishedWorkout(true);
    setLastResult(result);
  };

  const handleCloseCompletion = () => {
    setFinishedWorkout(false);
    setLastResult(null);
    setView('today');
  };

  if (activeWorkout) {
    return <WorkoutPlayer workout={activeWorkout} onComplete={handleComplete} />;
  }
  
  if (finishedWorkout) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <WorkoutCompletion result={lastResult} onRestart={handleCloseCompletion} buttonText="На главный экран" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 animate-fade-in">
        <header className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Симптомы</h1>
            <p className="mt-4 text-lg text-cyan-600 dark:text-cyan-300">Облегчите боль с помощью целевых упражнений</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SYMPTOMS_DATA.map((symptom) => (
                <div key={symptom.symptom} className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-lg p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{symptom.symptom}</h3>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-gray-300">
                            <p><strong className="text-slate-500 dark:text-gray-400">Причина:</strong> {symptom.cause}</p>
                            <p><strong className="text-slate-500 dark:text-gray-400">Последствие:</strong> {symptom.consequence}</p>
                            <p><strong className="text-slate-500 dark:text-gray-400">Что делать:</strong> {symptom.action}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => handleStartSymptomWorkout(symptom.symptom)}
                        disabled={!SYMPTOM_WORKOUTS[symptom.symptom]}
                        className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105 duration-300 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <PlayIcon />
                        <span className="ml-2">Начать тренировку</span>
                    </button>
                </div>
            ))}
        </div>
    </div>
  );
};

export default SymptomsView;
