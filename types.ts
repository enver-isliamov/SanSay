export type View = 'today' | 'program' | 'specialProgram' | 'profile' | 'symptoms';

export interface Summary {
    title: string;
    problem: string;
    conclusion: string;
    conditions: string[];
    timeline: string;
}

export interface Symptom {
    symptom: string;
    cause: string;
    consequence: string;
    action: string;
}

export interface RecoveryStage {
    id: number;
    stage: string;
    duration: string;
    goal: string;
    actions: string;
    totalDays?: number;
}

export interface Exercise {
    name: string;
    description: string;
    reps: string;
    sets?: number;
    hold?: number;
    duration?: number;
    type: 'reps' | 'timed';
}

export interface ExerciseCategory {
    title: string;
    goal: string;
    warning: string;
    exercises: Exercise[];
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Recommendation {
    title: string;
    points: string[];
}

export interface SpecialProgramStage {
    id: number;
    name: string;
    duration: string;
    goal: string;
    exercises: Exercise[];
}

export interface WorkoutSessionResult {
    completed: number;
    skipped: number;
    total: number;
    completedExercises?: Exercise[];
}

export interface WorkoutLog {
    date: string;
    completedWorkouts: string[];
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type FeedbackRating = 'good' | 'hard';

export interface SpecialProgramHistory {
    currentDay: number;
    completedToday: boolean;
}

export interface UserData {
    workoutHistory: WorkoutLog[];
    mainProgramHistory: Record<number, number>;
    specialProgramHistory: SpecialProgramHistory;
    exerciseFeedback: Record<string, FeedbackRating>;
    exerciseExecutionHistory: Record<string, number>;
}