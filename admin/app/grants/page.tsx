"use client";

import { useEffect, useState } from "react";
import LeadForm from "../../components/LeadForm";

interface GrantAtAGlance {
    candidates?: string;
    location?: string;
    legal_structures?: string | string[];
    annual_revenue?: string;
    org_size?: string;
    audience?: string | string[];
}

interface Grant {
    grant_id: string;
    title: string;
    funder_name: string;
    max_amount: number | null;
    deadline_close: string | null;
    categories: string[];
    source_url: string;
    summary: string;
    eligible_funding?: string;
    eligible_industries?: string[];
    financing_type?: string;
    at_a_glance?: GrantAtAGlance;
}

export default function DiscoveryPage() {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [tier, setTier] = useState<string>("public");
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);

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

    const closeDrawer = () => setSelectedGrant(null);

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            {/* Navigation */}
            <nav className="sticky top-0 z-[60] glass border-b border-[#D2D2D7]/30">
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
                        Ontario&apos;s most accurate funding repository. Over 3,700 grants processed with AI precision.
                    </p>
                </div>
            </section>

            {/* Filters */}
            <section className="max-w-[1380px] mx-auto px-6 mb-16">
                <div className="flex flex-wrap gap-6 items-center p-6 glass rounded-[28px] border border-[#D2D2D7]/30 shadow-sm relative z-10">
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider mb-2 ml-1">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#E8E8ED]/50 border-none focus:ring-2 focus:ring-blue-500 text-[14px] font-medium h-12 px-4 rounded-xl hover:bg-[#E8E8ED] transition-colors appearance-none cursor-pointer"
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
                            className="w-full bg-[#E8E8ED]/50 border-none focus:ring-2 focus:ring-blue-500 text-[14px] font-medium h-12 px-4 rounded-xl hover:bg-[#E8E8ED] transition-colors appearance-none cursor-pointer"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        {grants.map((grant) => (
                            <div key={grant.grant_id} className="group bg-white p-10 rounded-[28px] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between h-full border border-white">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="text-[11px] font-bold text-[#0066CC] uppercase bg-[#0066CC]/5 px-2.5 py-1 rounded-md">
                                            {grant.status === 'open' ? '● Open' : grant.status}
                                        </span>
                                        <span className="text-[13px] font-medium text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-full">
                                            {grant.deadline_close ? `Due ${new Date(grant.deadline_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Rolling'}
                                        </span>
                                    </div>
                                    <h3 className="text-[26px] font-bold leading-tight mb-3 tracking-tight group-hover:text-[#0066CC] transition-colors line-clamp-2">{grant.title}</h3>
                                    <p className="text-[15px] text-[#6E6E73] font-medium mb-6 leading-snug">{grant.funder_name}</p>

                                    {/* HelloDarwin-style Mini Glance */}
                                    <div className="space-y-4 py-6 border-t border-[#F5F5F7]">
                                        <div className="flex gap-3">
                                            <div className="w-5 h-5 bg-[#E8E8ED] rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-[10px]">💰</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-0.5">Eligible Funding</p>
                                                <p className="text-[13px] font-medium">{grant.eligible_funding || 'Up to 100% project cost'}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-5 h-5 bg-[#E8E8ED] rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-[10px]">🏢</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-0.5">Financing Type</p>
                                                <p className="text-[13px] font-medium bg-[#5856D6]/10 text-[#5856D6] px-2 py-0.5 rounded w-fit uppercase text-[11px] font-bold">
                                                    {grant.financing_type || 'Grant'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 mt-auto">
                                    <div>
                                        <span className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider block mb-1">Max Amount</span>
                                        <span className="text-[24px] font-bold tracking-tight">
                                            {grant.max_amount ? `$${grant.max_amount.toLocaleString()}` : "N/A"}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGrant(grant)}
                                        className="flex items-center gap-2 text-[14px] font-bold text-white bg-[#0066CC] px-8 py-3 rounded-full hover:bg-[#0071E3] shadow-[0_4px_12px_rgba(0,102,204,0.3)] transition-all active:scale-95"
                                    >
                                        View Details
                                    </button>
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

            {/* Grant Detail Drawer */}
            <div
                className={`fixed inset-0 z-[100] transition-opacity duration-500 ${selectedGrant ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />
                <div
                    className={`absolute right-0 top-0 h-full w-full max-w-[1000px] bg-[#F5F5F7] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${selectedGrant ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {selectedGrant && (
                        <>
                            {/* Header */}
                            <div className="bg-white border-b border-[#D2D2D7]/30 px-10 py-8 relative">
                                <button
                                    onClick={closeDrawer}
                                    className="absolute top-8 right-8 w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center text-xl hover:bg-[#E8E8ED] transition-colors"
                                >
                                    ✕
                                </button>
                                <div className="flex gap-2 items-center mb-6">
                                    <span className="bg-[#34C759] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">● Open</span>
                                    <span className="text-[11px] text-[#6E6E73] font-bold uppercase tracking-wider">{selectedGrant.funder_name}</span>
                                </div>
                                <h2 className="text-[40px] font-bold tracking-tight leading-tight mb-4 max-w-[80%]">{selectedGrant.title}</h2>
                                <div className="flex gap-4">
                                    <span className="bg-[#0066CC]/10 text-[#0066CC] text-[11px] font-bold px-3 py-1 rounded-md uppercase">Grant and Funding</span>
                                    <span className="text-[13px] text-[#6E6E73] font-medium self-center">Updated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* At a Glance Grid */}
                            <div className="p-10 flex-1 overflow-y-auto">
                                <div className="bg-white rounded-[28px] p-10 border border-[#D2D2D7]/30 mb-8 shadow-sm">
                                    <h3 className="text-[21px] font-bold mb-8 flex items-center gap-3">
                                        <span className="bg-[#E8E8ED] p-2 rounded-xl text-lg">💡</span>
                                        At a glance
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                        {/* Column 1 */}
                                        <div className="space-y-8">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">🎯 Candidates</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{selectedGrant.at_a_glance?.candidates || 'Professional, scientific and technical services'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">📍 Location</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{selectedGrant.at_a_glance?.location || 'Ontario, Canada'}</p>
                                            </div>
                                        </div>
                                        {/* Column 2 */}
                                        <div className="space-y-8">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">⚖️ Legal Structures</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{String(selectedGrant.at_a_glance?.legal_structures) || 'Non-profit, Registered Charity'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">📈 Annual Revenue</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{selectedGrant.at_a_glance?.annual_revenue || 'All revenue ranges'}</p>
                                            </div>
                                        </div>
                                        {/* Column 3 */}
                                        <div className="space-y-8">
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">👥 Org size</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{selectedGrant.at_a_glance?.org_size || '1-500 employees'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#A1A1A6] uppercase tracking-wider mb-2 flex items-center gap-2">📣 Audience</p>
                                                <p className="text-[15px] font-medium leading-relaxed">{String(selectedGrant.at_a_glance?.audience) || 'Canadians, Youth (<30)'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Sections */}
                                <div className="space-y-8">
                                    <div className="bg-white rounded-[28px] p-10 border border-[#D2D2D7]/30 shadow-sm">
                                        <h3 className="text-[21px] font-bold mb-4">Overview</h3>
                                        <p className="text-[17px] text-[#6E6E73] font-medium leading-relaxed">
                                            {selectedGrant.summary || 'Developing and commercializing new or improved products, services, or processes.'}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-[28px] p-10 border border-[#D2D2D7]/30 shadow-sm">
                                        <h3 className="text-[21px] font-bold mb-6">Criteria & Details</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <span className="text-[11px] font-bold text-[#A1A1A6] uppercase mb-1 block">Maximum Funding</span>
                                                <span className="text-2xl font-bold">{selectedGrant.max_amount ? `$${selectedGrant.max_amount.toLocaleString()}` : "N/A"}</span>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold text-[#A1A1A6] uppercase mb-1 block">Funder</span>
                                                <span className="text-2xl font-bold">{selectedGrant.funder_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 mb-20 flex gap-4">
                                    <a
                                        href={selectedGrant.source_url}
                                        target="_blank"
                                        className="flex-1 bg-[#1D1D1F] text-white text-center py-5 rounded-2xl font-bold text-[17px] hover:bg-black transition-all"
                                    >
                                        Apply on official site
                                    </a>
                                    <button className="flex-1 bg-white border border-[#D2D2D7] text-[#1D1D1F] py-5 rounded-2xl font-bold text-[17px] hover:bg-[#F5F5F7] transition-all">
                                        Save to My Grants
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

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
