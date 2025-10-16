import { supabase } from '../supabaseClient';
import { UserData } from '../types';

const KEYS = {
    WORKOUT_HISTORY: 'workoutHistory',
    MAIN_PROGRAM_HISTORY: 'mainProgramHistory',
    SPECIAL_PROGRAM_HISTORY: 'specialProgramHistory',
    EXERCISE_FEEDBACK: 'exerciseFeedback',
    EXERCISE_EXECUTION_HISTORY: 'exerciseExecutionHistory',
};

const ALL_DATA_KEYS = Object.values(KEYS);

// --- LocalStorage Functions ---

export const loadDataFromLocalStorage = (): UserData => {
    try {
        const workoutHistory = JSON.parse(localStorage.getItem(KEYS.WORKOUT_HISTORY) || '[]');
        const mainProgramHistory = JSON.parse(localStorage.getItem(KEYS.MAIN_PROGRAM_HISTORY) || '{}');
        const specialProgramHistory = JSON.parse(localStorage.getItem(KEYS.SPECIAL_PROGRAM_HISTORY) || '{"currentDay":1,"completedToday":false}');
        const exerciseFeedback = JSON.parse(localStorage.getItem(KEYS.EXERCISE_FEEDBACK) || '{}');
        const exerciseExecutionHistory = JSON.parse(localStorage.getItem(KEYS.EXERCISE_EXECUTION_HISTORY) || '{}');
        
        return { workoutHistory, mainProgramHistory, specialProgramHistory, exerciseFeedback, exerciseExecutionHistory };
    } catch (e) {
        console.error("Failed to load data from localStorage", e);
        return { workoutHistory: [], mainProgramHistory: {}, specialProgramHistory: { currentDay: 1, completedToday: false }, exerciseFeedback: {}, exerciseExecutionHistory: {} };
    }
};

export const saveDataToLocalStorage = (data: UserData) => {
    try {
        localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(data.workoutHistory || []));
        localStorage.setItem(KEYS.MAIN_PROGRAM_HISTORY, JSON.stringify(data.mainProgramHistory || {}));
        localStorage.setItem(KEYS.SPECIAL_PROGRAM_HISTORY, JSON.stringify(data.specialProgramHistory || { currentDay: 1, completedToday: false }));
        localStorage.setItem(KEYS.EXERCISE_FEEDBACK, JSON.stringify(data.exerciseFeedback || {}));
        localStorage.setItem(KEYS.EXERCISE_EXECUTION_HISTORY, JSON.stringify(data.exerciseExecutionHistory || {}));
    } catch (e) {
        console.error("Failed to save data to localStorage", e);
    }
};

export const clearLocalStorageData = () => {
    console.log("Clearing local user data after sync...");
    ALL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
};


// --- Supabase Functions ---

export const syncLocalToSupabase = async (uid: string) => {
    try {
        const localData = loadDataFromLocalStorage();
        // Upsert combines insert and update. It will create a new row if one doesn't exist.
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: uid, user_data: localData });
        if (error) throw error;
    } catch (e) {
        console.error("Failed to sync local data to Supabase", e);
    }
};

export const loadDataFromSupabase = async (uid: string): Promise<UserData | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_data')
            .eq('id', uid)
            .single();

        if (error) {
            // 'PGRST116' means no rows were found, which is expected for a new user.
            // We don't want to log this as a critical error.
            if (error.code !== 'PGRST116') {
                throw error;
            }
            return null;
        }
        return data ? data.user_data as UserData : null;
    } catch (e) {
        console.error("Failed to load data from Supabase", e);
        return null;
    }
};

export const saveDataToSupabase = async (uid: string, data: UserData) => {
    try {
         // Upsert is used here as well to ensure the row is created if it somehow doesn't exist.
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: uid, user_data: data });
        if (error) throw error;
    } catch (e) {
        console.error("Failed to save data to Supabase", e);
    }
};
