"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithGoogleRedirect: () => Promise<void>;
    logout: () => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    signInWithGoogleRedirect: async () => { },
    logout: async () => { },
    error: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check for redirect result on mount
        getRedirectResult(auth).then((result) => {
            if (result) {
                // User is signed in.
                // The onAuthStateChanged listener will handle the state update/redirect
            }
        }).catch((error) => {
            console.error("Redirect login failed", error);
            setError(error.message);
        });

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const signInWithGoogle = async () => {
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/");
        } catch (error: any) {
            console.error("Login failed", error);
            setError(error.message);
        }
    };

    const signInWithGoogleRedirect = async () => {
        setError(null);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithRedirect(auth, provider);
        } catch (error: any) {
            console.error("Redirect login init failed", error);
            setError(error.message);
        }
    };

    const logout = async () => {
        await signOut(auth);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithGoogleRedirect, logout, error }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
