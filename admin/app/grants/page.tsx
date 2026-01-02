"use client";

import { useEffect, useState } from "react";
import LeadForm from "../../components/LeadForm";

interface Grant {
    grant_id: string;
    title: string;
    funder_name: string;
    max_amount: number | null;
    deadline_close: string | null;
    categories: string[];
    source_url: string;
}

export default function DiscoveryPage() {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tier, setTier] = useState<string>("public");

    // Filters
    const [category, setCategory] = useState("");
    const [deadline, setDeadline] = useState("");

    const fetchGrants = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category) params.append("category", category);
            if (deadline) params.append("max_deadline_days", deadline);

            // Fetching from the API (Public tier, no X-API-Key)
            // Note: In prod, this URL would be your Cloud Run endpoint
            const res = await fetch(`http://localhost:8080/api/v1/grants?${params.toString()}`);
            const data = await res.json();
            setGrants(data.grants || []);
            setTotalCount(data.total_count || 0);
            setTier(data.tier);
        } catch (error) {
            console.error("Failed to fetch grants", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGrants();
    }, [category, deadline]);

    return (
        <div className="min-h-screen bg-[#FBFBFB] text-[#1D1D1F]">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold tracking-tight">GrantsPlatform</span>
                        <span className="bg-gray-100 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Beta</span>
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-black transition-colors">Pricing</a>
                        <a href="/login" className="px-4 py-1.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all">Sign In</a>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-6xl mx-auto px-6 pt-20 pb-12">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
                    Find your next grant.
                </h1>
                <p className="text-xl text-gray-500 max-w-2xl">
                    The intelligence engine for Ontario nonprofits. Discover curated funding opportunities with real-time accuracy.
                </p>
            </section>

            {/* Filters */}
            <section className="max-w-6xl mx-auto px-6 mb-12">
                <div className="flex flex-wrap gap-4 items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium h-10 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <option value="">All Categories</option>
                            <option value="community">Community</option>
                            <option value="youth">Youth</option>
                            <option value="capital">Capital</option>
                            <option value="sports">Sports</option>
                            <option value="arts">Arts</option>
                            <option value="environment">Environment</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Deadline</label>
                        <select
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium h-10 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <option value="">Any time</option>
                            <option value="30">Next 30 days</option>
                            <option value="60">Next 60 days</option>
                            <option value="90">Next 90 days</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Grants List */}
            <section className="max-w-6xl mx-auto px-6 pb-24">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-3xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {grants.map((grant) => (
                            <div key={grant.grant_id} className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                                            {grant.categories?.[0] || 'Uncategorized'}
                                        </span>
                                        <span className="text-sm font-medium text-gray-400">
                                            Due {grant.deadline_close ? new Date(grant.deadline_close).toLocaleDateString() : 'Rolling'}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition-colors">{grant.title}</h3>
                                    <p className="text-gray-500 mb-6 font-medium">{grant.funder_name}</p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Max Amount</span>
                                        <span className="text-xl font-bold">
                                            {grant.max_amount ? `$${grant.max_amount.toLocaleString()}` : "N/A"}
                                        </span>
                                    </div>
                                    <a
                                        href={grant.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm font-bold text-black border-2 border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all"
                                    >
                                        View Source
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Soft Gate */}
                {tier === 'public' && totalCount > grants.length && (
                    <div className="bg-black text-white p-12 rounded-[40px] text-center max-w-3xl mx-auto shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        <h2 className="text-3xl font-bold mb-4">Showing {grants.length} of {totalCount} grants.</h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Get full access to our entire database, advanced filters, and real-time grant alerts.
                        </p>
                        <LeadForm />
                        <p className="text-[10px] text-zinc-500 mt-6 uppercase tracking-widest font-bold">
                            No credit card required • Join 200+ nonprofits
                        </p>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 py-12">
                <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-sm text-gray-400 font-medium">© 2026 HJD Consulting. All rights reserved.</p>
                    <div className="flex gap-8 text-sm font-bold text-gray-400 uppercase tracking-tight">
                        <a href="#" className="hover:text-black">Privacy</a>
                        <a href="#" className="hover:text-black">Terms</a>
                        <a href="#" className="hover:text-black">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
