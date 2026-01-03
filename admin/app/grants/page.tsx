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
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-blue-100 selection:text-blue-900">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-[#D2D2D7]/30">
                <div className="max-w-[1380px] mx-auto px-6 h-[52px] flex items-center justify-between font-sans">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold tracking-tight">GrantsPlatform</span>
                        <span className="bg-[#E8E8ED] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase text-[#6E6E73]">Beta</span>
                    </div>
                    <div className="flex gap-8 text-[12px] font-medium text-[#1D1D1F]/80">
                        <a href="#" className="hover:text-black transition-colors">Pricing</a>
                        <a href="/login" className="px-3 py-1 bg-[#1D1D1F] text-white rounded-full hover:bg-black transition-all font-semibold">Sign In</a>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-[1380px] mx-auto px-6 pt-32 pb-16">
                <div className="max-w-4xl">
                    <h1 className="text-[56px] md:text-[64px] font-bold tracking-[-0.025em] leading-[1.05] mb-6">
                        Find your next grant.
                    </h1>
                    <p className="text-[21px] md:text-[24px] text-[#6E6E73] font-medium leading-relaxed max-w-2xl">
                        The intelligence engine for Ontario nonprofits. Discover curated funding opportunities with real-time accuracy.
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className="max-w-[1380px] mx-auto px-6 mb-16">
                <div className="flex flex-wrap gap-6 items-center p-6 glass rounded-[28px] border border-[#D2D2D7]/30 shadow-sm">
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2 ml-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#E8E8ED]/50 border-none focus:ring-2 focus:ring-blue-500 text-[14px] font-medium h-12 px-4 rounded-xl hover:bg-[#E8E8ED] transition-colors appearance-none"
                        >
                            <option value="">All Categories</option>
                            <option value="youth">Youth</option>
                            <option value="arts">Arts</option>
                            <option value="environment">Environment</option>
                            <option value="sports">Sports</option>
                            <option value="community">Community</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2 ml-1">Deadline</label>
                        <select
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-[#E8E8ED]/50 border-none focus:ring-2 focus:ring-blue-500 text-[14px] font-medium h-12 px-4 rounded-xl hover:bg-[#E8E8ED] transition-colors appearance-none"
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
            <section className="max-w-[1380px] mx-auto px-6 pb-32">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] bg-white rounded-[28px] animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                        {grants.map((grant) => (
                            <div key={grant.grant_id} className="group bg-white p-10 rounded-[28px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between h-full border border-white">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-[11px] font-bold text-[#0066CC] uppercase bg-[#E8E8ED] px-2.5 py-1 rounded-md">
                                            {grant.categories?.[0] || 'Curated'}
                                        </span>
                                        <span className="text-[13px] font-medium text-[#6E6E73]">
                                            {grant.deadline_close ? `Due ${new Date(grant.deadline_close).toLocaleDateString()}` : 'Rolling'}
                                        </span>
                                    </div>
                                    <h3 className="text-[28px] font-bold leading-tight mb-3 group-hover:text-[#0066CC] transition-colors line-clamp-2 tracking-tight">{grant.title}</h3>
                                    <p className="text-[17px] text-[#6E6E73] font-medium mb-8 leading-snug">{grant.funder_name}</p>
                                </div>

                                <div className="flex items-end justify-between pt-6 border-t border-[#F5F5F7]">
                                    <div>
                                        <span className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider block mb-1">Max Amount</span>
                                        <span className="text-[24px] font-bold tracking-tight">
                                            {grant.max_amount ? `$${grant.max_amount.toLocaleString()}` : "N/A"}
                                        </span>
                                    </div>
                                    <a
                                        href={grant.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[14px] font-bold text-white bg-[#1D1D1F] px-6 py-2.5 rounded-full hover:bg-black shadow-sm transition-all"
                                    >
                                        Details
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Soft Gate */}
                {tier === 'public' && totalCount > grants.length && (
                    <div className="bg-[#1D1D1F] text-white p-16 rounded-[40px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#0066CC]"></div>
                        <h2 className="text-[32px] md:text-[40px] font-bold mb-6 tracking-tight">Showing {grants.length} of {totalCount} grants.</h2>
                        <p className="text-[19px] text-[#A1A1A6] mb-12 max-w-xl mx-auto leading-relaxed font-medium">
                            Unlock our full intelligence database, advanced filtering, and instant grant alerts for your sector.
                        </p>
                        <div className="max-w-md mx-auto">
                            <LeadForm />
                        </div>
                        <p className="text-[11px] text-[#6E6E73] mt-10 uppercase tracking-[0.2em] font-bold">
                            Trusted by 200+ Ontario Nonprofits
                        </p>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className="footer-content max-w-[1380px] mx-auto px-6 py-20 border-t border-[#D2D2D7]/30">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10">
                    <p className="text-[12px] text-[#6E6E73] font-medium">Copyright © 2026 HJD Consulting. All rights reserved.</p>
                    <div className="flex gap-10 text-[12px] font-bold text-[#6E6E73] uppercase tracking-widest">
                        <a href="#" className="hover:text-[#1D1D1F] transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-[#1D1D1F] transition-colors">Terms of Use</a>
                        <a href="#" className="hover:text-[#1D1D1F] transition-colors">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
