import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Workout, Exercise, WorkoutSessionResult, FeedbackRating } from '../types';
import CircularTimer from './CircularTimer';
import { PlayCircleIcon } from './icons/PlayCircleIcon';
import { PauseCircleIcon } from './icons/PauseCircleIcon';
import { ChevronLeftCircleIcon } from './icons/ChevronLeftCircleIcon';
import { ChevronRightCircleIcon } from './icons/ChevronRightCircleIcon';
import { ThumbsUpIcon } from './icons/ThumbsUpIcon';
import { ThumbsDownIcon } from './icons/ThumbsDownIcon';
import { useAudio } from '../hooks/useAudio';
import { useAuth } from '../hooks/useAuth';

interface WorkoutPlayerProps {
  workout: Workout;
  onComplete: (result: WorkoutSessionResult) => void;
}

const SET_REST_DURATION = 30;
const EXERCISE_REST_DURATION = 60;
const WORKOUT_STATE_KEY = 'workoutPlayerState';

interface WorkoutState {
    workoutId: string;
    currentExerciseIndex: number;
    currentSet: number;
    phase: 'exercise' | 'rest';
    timeLeft: number;
    completedExercises: number[];
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onComplete }) => {
  const [playStart] = useAudio('/assets/start.mp3');
  const [playComplete] = useAudio('/assets/complete.mp3');
  const [playRest] = useAudio('/assets/rest.mp3');
  
  const { userData, setUserData } = useAuth();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [sessionFeedback, setSessionFeedback] = useState<Record<string, FeedbackRating>>({});
  const isResumedSession = useRef(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
        const savedStateJSON = localStorage.getItem(WORKOUT_STATE_KEY);
        if (savedStateJSON) {
            const savedState: WorkoutState = JSON.parse(savedStateJSON);
            if (savedState.workoutId === workout.id) {
                isResumedSession.current = true; // Set flag to prevent setup effect on first render
                setCurrentExerciseIndex(savedState.currentExerciseIndex);
                setCurrentSet(savedState.currentSet);
                setPhase(savedState.phase);
                setTimeLeft(savedState.timeLeft);
                setCompletedExercises(new Set(savedState.completedExercises));
                // Automatically start playing if it was a timed phase
                if ((savedState.phase === 'rest' || workout.exercises[savedState.currentExerciseIndex]?.type === 'timed') && savedState.timeLeft > 0) {
                    setIsPlaying(true);
                }
                return; // Exit early if state is loaded
            }
        }
    } catch (e) {
        console.error("Failed to load workout state", e);
        localStorage.removeItem(WORKOUT_STATE_KEY);
    }
  }, [workout.id]);

  const currentExercise = useMemo(() => workout.exercises[currentExerciseIndex], [workout.exercises, currentExerciseIndex]);
  const nextExercise = useMemo(() => workout.exercises[currentExerciseIndex + 1], [workout.exercises, currentExerciseIndex]);

  const totalSets = currentExercise?.sets || 1;
  const isTimedExercise = currentExercise?.type === 'timed';
  const exerciseDuration = currentExercise?.duration || currentExercise?.hold || 0;
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
      if (currentExercise) {
          const state: WorkoutState = {
              workoutId: workout.id,
              currentExerciseIndex,
              currentSet,
              phase,
              timeLeft,
              completedExercises: Array.from(completedExercises),
          };
          localStorage.setItem(WORKOUT_STATE_KEY, JSON.stringify(state));
      }
  }, [workout.id, currentExerciseIndex, currentSet, phase, timeLeft, completedExercises]);


  const clearSavedState = useCallback(() => {
    localStorage.removeItem(WORKOUT_STATE_KEY);
  }, []);

  const handleFinishWorkout = useCallback(() => {
    clearSavedState();
    // Fix: Explicitly type `index` as `number` to resolve TypeScript inference issue where it was treated as `unknown`.
    const completedExerciseObjects = Array.from(completedExercises).map((index: number) => workout.exercises[index]);
    const result: WorkoutSessionResult = {
      completed: completedExercises.size,
      skipped: workout.exercises.length - completedExercises.size,
      total: workout.exercises.length,
      completedExercises: completedExerciseObjects,
    };
    onComplete(result);
  }, [clearSavedState, completedExercises, workout.exercises, onComplete]);


  const handleSetComplete = useCallback((isSuccess: boolean) => {
    setIsPlaying(false);
    playComplete();
    if (isSuccess) {
      setCompletedExercises(prev => new Set(prev).add(currentExerciseIndex));
    }

    if (currentSet < totalSets) {
      setPhase('rest');
      setTimeLeft(SET_REST_DURATION);
      setIsPlaying(true);
      playRest();
    } else {
      if (currentExerciseIndex >= workout.exercises.length - 1) {
        handleFinishWorkout();
        return;
      }
      setPhase('rest');
      setTimeLeft(EXERCISE_REST_DURATION);
      setIsPlaying(true);
      playRest();
    }
  }, [playComplete, playRest, currentSet, totalSets, currentExerciseIndex, workout.exercises.length, handleFinishWorkout]);


  const handleRestComplete = useCallback(() => {
    setIsPlaying(false);
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      setPhase('exercise');
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
      setCurrentSet(1);
      setPhase('exercise');
    }
  }, [currentSet, totalSets]);

  // Effect to set up a new exercise or set
  useEffect(() => {
    if (!currentExercise) return;
    
    // If this is a resumed session, the state is already correct from the loading effect.
    // We just need to reset the flag and skip this setup for the initial render.
    if (isResumedSession.current) {
        isResumedSession.current = false;
        return;
    }

    if (phase === 'exercise') {
      playStart();
      setTimeLeft(exerciseDuration);
      if (isTimedExercise) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }
  }, [currentExercise, currentSet, phase, isTimedExercise, exerciseDuration, playStart, currentExerciseIndex, workout.id]);

  // Effect for the main timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) {
      if (timeLeft <= 0) {
        if (phase === 'exercise' && isTimedExercise) {
          handleSetComplete(true);
        } else if (phase === 'rest') {
          handleRestComplete();
        }
      }
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isPlaying, timeLeft, phase, isTimedExercise, handleSetComplete, handleRestComplete]);


  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSet(1);
      setPhase('exercise');
    }
  };

  const handleNext = () => {
    if (phase === 'exercise') {
      if (!isTimedExercise) {
        handleSetComplete(true);
      } else {
        handleSetComplete(false); // Skip timed exercise
      }
    } else {
      handleRestComplete(); // Skip rest
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleFeedback = (rating: FeedbackRating) => {
    if (!currentExercise) return;
    
    // Update session state for immediate UI feedback within this workout
    setSessionFeedback(prev => ({...prev, [currentExercise.name]: rating}));
    
    // Update persistent storage via context
    const currentFeedback = userData.exerciseFeedback || {};
    const newFeedback = {
        ...currentFeedback,
        [currentExercise.name]: rating,
    };
    setUserData({ ...userData, exerciseFeedback: newFeedback });
  };

  if (!currentExercise) {
    return <div>Workout not found or has no exercises.</div>;
  }
  
  const repCountMatch = currentExercise.reps.match(/(\d+–\d+)|(\d+)/);
  const displayReps = repCountMatch ? repCountMatch[0] : '—';
  const fontSizeClass = displayReps.length > 4 ? 'text-5xl' : 'text-6xl';

  const isSetRest = currentSet < totalSets;
  const restDuration = isSetRest ? SET_REST_DURATION : EXERCISE_REST_DURATION;
  const nextUpText = isSetRest
    ? `Далее: Подход ${currentSet + 1}`
    : nextExercise
    ? `Далее: ${nextExercise.name}`
    : 'Тренировка почти закончена!';

  const timerKey = `${currentExerciseIndex}-${currentSet}-${phase}`;

  return (
    <div className={`container mx-auto px-4 flex flex-col h-[calc(100vh-6rem)] animate-fade-in rounded-t-2xl transition-colors duration-500 ${
        phase === 'rest' ? 'bg-sky-50 dark:bg-slate-800' : ''
    }`}>
        {/* Header */}
        <div className="flex-shrink-0 py-4 flex justify-between items-center">
            <p className="text-cyan-500 dark:text-cyan-400 font-semibold">
                Упражнение {currentExerciseIndex + 1} из {workout.exercises.length}
            </p>
            <button
                  onClick={handleFinishWorkout}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-gray-300 rounded-full text-sm font-semibold"
              >
                  Завершить
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-2xl mb-6">
                <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight ${
                    phase === 'rest' 
                    ? 'text-sky-500 dark:text-sky-400' 
                    : 'text-slate-900 dark:text-white'
                }`}>
                    {phase === 'exercise' ? currentExercise.name : (isSetRest ? 'Отдых' : 'Перерыв')}
                </h1>
                {phase === 'exercise' ? (
                    totalSets > 1 && <p className="mt-1 text-lg font-medium text-slate-700 dark:text-gray-200">Подход {currentSet} из {totalSets}</p>
                ) : (
                    <p className="mt-1 text-lg font-medium text-slate-700 dark:text-gray-200">{nextUpText}</p>
                )}
            </div>

            <div className="h-[200px] flex items-center justify-center">
                {phase === 'exercise' ? (
                    isTimedExercise ? (
                        <div className="w-52 h-52 flex items-center justify-center relative">
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/60 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg animate-scale-in">
                                <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Осталось</span>
                                <span className="text-6xl font-bold text-cyan-500 dark:text-cyan-400 my-1">{timeLeft}</span>
                                <span className="text-lg text-slate-600 dark:text-gray-300">секунд</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-52 h-52 flex items-center justify-center relative">
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/60 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-lg animate-scale-in">
                                <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Цель</span>
                                <span className={`${fontSizeClass} font-bold text-cyan-500 dark:text-cyan-400 my-1`}>{displayReps}</span>
                                <span className="text-lg text-slate-600 dark:text-gray-300">повторений</span>
                            </div>
                        </div>
                    )
                ) : (
                     <CircularTimer
                        key={timerKey}
                        duration={restDuration}
                        timeLeft={timeLeft}
                        size={200}
                        strokeWidth={16}
                        colorClassName="text-sky-500 dark:text-sky-400"
                    />
                )}
            </div>
             <div className="mt-6 h-28 flex flex-col justify-start">
                <p className="text-slate-600 dark:text-gray-300">
                    {phase === 'exercise' ? currentExercise.description : ''}
                </p>

                {phase === 'rest' && !isSetRest && currentExercise && (
                  <div className="mt-4 animate-fade-in text-center">
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Как вам последнее упражнение?</p>
                    <div className="flex justify-center space-x-4">
                      <button 
                        onClick={() => handleFeedback('good')}
                        className={`p-3 rounded-full transition-colors ${sessionFeedback[currentExercise.name] === 'good' ? 'bg-green-200 dark:bg-green-800/60 text-green-700 dark:text-green-300' : 'bg-slate-200 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 dark:text-gray-300'}`}
                        aria-label="Помогло"
                      >
                        <ThumbsUpIcon className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={() => handleFeedback('hard')}
                        className={`p-3 rounded-full transition-colors ${sessionFeedback[currentExercise.name] === 'hard' ? 'bg-red-200 dark:bg-red-800/60 text-red-700 dark:text-red-300' : 'bg-slate-200 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 dark:text-gray-300'}`}
                        aria-label="Слишком сложно"
                      >
                        <ThumbsDownIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                )}
            </div>
        </div>
        
        {/* Footer Controls */}
        <div className="flex-shrink-0 py-4">
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-6 w-full">
                  <div className="flex-1 text-left">
                    <button 
                        onClick={handlePrevious} 
                        disabled={currentExerciseIndex === 0} 
                        className="text-slate-400 dark:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-110"
                      >
                          <ChevronLeftCircleIcon />
                      </button>
                  </div>
                  
                  {phase === 'rest' || isTimedExercise ? (
                      <button onClick={handleTogglePlay} className="text-cyan-500 dark:text-cyan-400 transition-transform transform hover:scale-110">
                          {isPlaying ? <PauseCircleIcon className="w-20 h-20" /> : <PlayCircleIcon className="w-20 h-20" />}
                      </button>
                  ) : (
                       <button
                          onClick={() => handleSetComplete(true)}
                          className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-full shadow-lg transition-transform transform hover:scale-105"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                  )}
                  
                  <div className="flex-1 text-right">
                    <button 
                        onClick={handleNext}
                        className="text-cyan-500 dark:text-cyan-400 transition-transform transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <ChevronRightCircleIcon />
                      </button>
                  </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-4 h-5">
                  {phase === 'rest' 
                    ? 'Нажмите "Вперед", чтобы пропустить отдых'
                    : (isTimedExercise ? 'Нажмите "Вперед", чтобы пропустить' : 'Нажмите "Вперед", чтобы завершить подход')}
              </p>
          </div>
        </div>
    </div>
  );
};

export default WorkoutPlayer;