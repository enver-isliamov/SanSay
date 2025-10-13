import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { User, UserData } from '../types';
import { loadDataFromFirestore, syncLocalToFirestore, saveDataToFirestore, loadDataFromLocalStorage, saveDataToLocalStorage, clearLocalStorageData } from '../services/dataService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userData: UserData;
    setUserData: (data: UserData) => void;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
}

const defaultUserData: UserData = {
    workoutHistory: [],
    mainProgramHistory: {},
    specialProgramHistory: { currentDay: 1, completedToday: false },
    exerciseFeedback: {},
    exerciseExecutionHistory: {},
};

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userData: defaultUserData,
    setUserData: () => {},
    signIn: async () => {},
    signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserDataState] = useState<UserData>(defaultUserData);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const formattedUser: User = {
                    uid: firebaseUser.uid,
                    displayName: firebaseUser.displayName,
                    email: firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                };
                setUser(formattedUser);
                
                let data = await loadDataFromFirestore(formattedUser.uid);
                if (!data) {
                    console.log("First login, syncing local data to Firestore...");
                    await syncLocalToFirestore(formattedUser.uid);
                    data = await loadDataFromFirestore(formattedUser.uid);
                    // Clear local data after sync to use Firestore as the single source of truth
                    clearLocalStorageData();
                }
                setUserDataState(data || defaultUserData);
            } else {
                setUser(null);
                const localData = loadDataFromLocalStorage();
                setUserDataState(localData);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const setUserData = (newUserData: UserData) => {
        setUserDataState(newUserData);
        if (user) {
            saveDataToFirestore(user.uid, newUserData);
        } else {
            saveDataToLocalStorage(newUserData);
        }
    };

    const signIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google:", error);
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const value = {
        user,
        loading,
        userData,
        setUserData,
        signIn,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
