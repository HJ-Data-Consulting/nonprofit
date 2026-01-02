"use client";

import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [grants, setGrants] = useState<DocumentData[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "grants"), orderBy("last_verified_at", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grantsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGrants(grantsData);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || !user) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Grants Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900">Active Grants ({grants.length})</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              + Add Grant
            </button>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {grants.map((grant) => (
                <li key={grant.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">{grant.title}</p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${grant.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {grant.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {grant.funder_id}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Amount: ${grant.min_amount?.toLocaleString()} - ${grant.max_amount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {grants.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500">
                  No grants found. Run the scraper or seeder!
                </li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
