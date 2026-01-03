"use client";

import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function LeadForm() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await addDoc(collection(db, 'leads'), {
                email,
                source: 'discovery_page',
                tier_interest: 'pro',
                timestamp: serverTimestamp()
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Lead capture failed:', err);
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white/10 border border-white/20 p-8 rounded-[32px] animate-in fade-in zoom-in duration-500">
                <p className="text-[24px] font-bold text-white mb-2">You're on the list!</p>
                <p className="text-[#A1A1A6] font-medium leading-relaxed">We'll notify you as soon as the Pro platform launches in your region.</p>
            </div>
        );
    }

    const status = loading ? 'loading' : (submitted ? 'success' : 'idle');

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/40 px-6 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0066CC] transition-all font-medium"
            />
            <button
                type="submit"
                disabled={status === 'loading'}
                className={`px-8 py-4 rounded-full font-bold text-[15px] transition-all transform active:scale-95 whitespace-nowrap ${status === 'loading'
                        ? 'bg-white/20 text-white/50 cursor-not-allowed'
                        : 'bg-white text-[#1D1D1F] hover:bg-[#E8E8ED]'
                    }`}
            >
                {status === 'loading' ? 'Processing...' : 'Get Early Access'}
            </button>
            {error && <p className="text-[#FF453A] text-xs mt-4 font-bold uppercase tracking-widest">{error}</p>}
        </form>
    );
}
