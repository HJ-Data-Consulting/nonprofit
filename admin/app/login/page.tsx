"use client";

import { useAuth } from "../../contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const { user, signInWithGoogle, signInWithGoogleRedirect, error } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push("/");
        }
    }, [user, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96 text-center">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Grants Admin</h1>
                <p className="mb-6 text-gray-600">Sign in to manage grants</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={signInWithGoogle}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2 mb-3"
                >
                    Sign in with Google (Popup)
                </button>

                <button
                    onClick={signInWithGoogleRedirect}
                    className="w-full bg-white text-gray-700 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm"
                >
                    Use Redirect Login (If Popup Fails)
                </button>
            </div>
        </div>
    );
}
