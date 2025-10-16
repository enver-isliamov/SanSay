import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import { User, UserData } from '../types';
import { Session } from '@supabase/supabase-js';
import { loadDataFromSupabase, syncLocalToSupabase, saveDataToSupabase, loadDataFromLocalStorage, saveDataToLocalStorage, clearLocalStorageData } from '../services/dataService';

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
    
    const handleAuthChange = async (session: Session | null) => {
        const supabaseUser = session?.user;
        if (supabaseUser) {
            const formattedUser: User = {
                uid: supabaseUser.id,
                displayName: supabaseUser.user_metadata.full_name || supabaseUser.email || 'User',
                email: supabaseUser.email || null,
                photoURL: supabaseUser.user_metadata.avatar_url || null,
            };
            setUser(formattedUser);
            
            let data = await loadDataFromSupabase(formattedUser.uid);
            if (!data) {
                console.log("First login, syncing local data to Supabase...");
                await syncLocalToSupabase(formattedUser.uid);
                data = await loadDataFromSupabase(formattedUser.uid);
                 // Clear local data after successful sync to use Supabase as the single source of truth
                if (data) {
                    clearLocalStorageData();
                }
            }
            setUserDataState(data || defaultUserData);
        } else {
            setUser(null);
            const localData = loadDataFromLocalStorage();
            setUserDataState(localData);
        }
        setLoading(false);
    }

    useEffect(() => {
        // Check for an active session when the component mounts
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange(session);
        });

        // Listen for changes in authentication state
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleAuthChange(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const setUserData = (newUserData: UserData) => {
        setUserDataState(newUserData);
        if (user) {
            saveDataToSupabase(user.uid, newUserData);
        } else {
            saveDataToLocalStorage(newUserData);
        }
    };

    const signIn = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            console.error("Error signing in with Google:", error);
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
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
