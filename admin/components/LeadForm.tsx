"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface LeadFormProps {
    onSuccess?: () => void;
}

export default function LeadForm({ onSuccess }: LeadFormProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError("");

        try {
            await addDoc(collection(db, "leads"), {
                email,
                source: "discovery_soft_gate",
                created_at: serverTimestamp(),
            });
            setSubmitted(true);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Failed to save lead", err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center animate-in fade-in zoom-in duration-500">
                <h3 className="text-2xl font-bold mb-2">You're on the list! </h3>
                <p className="text-gray-400">We'll notify you when full access is available.</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="bg-zinc-900 border-none rounded-full px-6 py-3 w-full sm:w-auto min-w-[280px] focus:ring-2 focus:ring-blue-500 transition-all font-medium text-white"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-all w-full sm:w-auto disabled:opacity-50"
                >
                    {loading ? "Joining..." : "Get Early Access"}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-4 font-bold uppercase tracking-widest">{error}</p>}
        </form>
    );
}
