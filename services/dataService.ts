import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
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

// --- Firestore Functions ---

const getUserDocRef = (uid: string) => doc(db, 'users', uid);

export const syncLocalToFirestore = async (uid: string) => {
    try {
        const localData = loadDataFromLocalStorage();
        const docRef = getUserDocRef(uid);
        await setDoc(docRef, { ...localData, hasSynced: true });
    } catch (e) {
        console.error("Failed to sync local data to Firestore", e);
    }
};

export const loadDataFromFirestore = async (uid: string): Promise<UserData | null> => {
    try {
        const docRef = getUserDocRef(uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (e) {
        console.error("Failed to load data from Firestore", e);
        return null;
    }
};

export const saveDataToFirestore = async (uid: string, data: UserData) => {
    try {
        const docRef = getUserDocRef(uid);
        await setDoc(docRef, data, { merge: true });
    } catch (e) {
        console.error("Failed to save data to Firestore", e);
    }
};
