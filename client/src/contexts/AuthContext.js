import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(()=> {
        let active = true;
        const unsubcribe = onAuthStateChanged(auth,
            async (firebaseUser) =>{
                if (!active) return;
                if(firebaseUser) {
                    setUser(firebaseUser);
                    setLoading(false);
                    setError(null);
                    return;
                }
                setUser(null);
                try {
                    setLoading(true);
                    setError(null);
                    await signInAnonymously(auth);
                } catch (error) {
                    if (!active) return;
                    console.error("Error signing in anonymously", error);
                    setError(error.message);
                    setLoading(false);
                }
            }
        )
        return () => { active = false; unsubcribe(); };
    }, [])

    return (
        <AuthContext.Provider value={{user, loading, error}}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => useContext(AuthContext);
