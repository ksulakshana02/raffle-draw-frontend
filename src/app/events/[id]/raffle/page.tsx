"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RaffleDraw } from "@/components/RaffleDraw";
import api from "@/lib/api";
import { Participant, Gift } from "@/types";
import { Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function RafflePage() {
    const params = useParams();
    const eventId = params.id as string;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [prizes, setPrizes] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [inputKey, setInputKey] = useState("");
    const [eventTitle, setEventTitle] = useState("");
    const [checking, setChecking] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setChecking(true);
        try {
            const { data: event } = await api.get(`/events/${eventId}`);
            if (event.enrollmentKey === inputKey) {
                setAuthorized(true);
                setEventTitle(event.title);
                setPrizes(event.gifts || []);
                fetchCandidates();
            } else {
                alert("Invalid Enrollment Key");
            }
        } catch (error) {
            console.error(error);
            alert("Error verifying key");
        } finally {
            setChecking(false);
        }
    };

    const fetchCandidates = async () => {
        try {
            const { data } = await api.get(`/raffle/candidates?eventId=${eventId}`);
            setParticipants(data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
        }
    };

    const handleWinnerRecorded = (userId: number) => {
        setParticipants(prev => prev.filter(p => p.id !== userId));
    };

    if (!authorized) {
        return (
            <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-purple-950 to-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 w-full max-w-md"
                >
                    <div className="bg-black/30 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white/5 rounded-full ring-1 ring-white/20">
                                <Lock className="w-8 h-8 text-white" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold mb-2 text-center text-white tracking-tight">Restricted Access</h2>
                        <p className="text-white/50 text-center mb-8">Enter the event key to access the raffle.</p>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={inputKey}
                                    onChange={(e) => setInputKey(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-center text-lg tracking-widest uppercase font-mono"
                                    placeholder="ENTER KEY"
                                />
                            </div>
                            <button
                                disabled={checking}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {checking ? "Verifying..." : (
                                    <>
                                        ENTER <Sparkles className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white/50 font-medium tracking-widest uppercase text-sm">Loading Participants...</p>
                </div>
            </div>
        );
    }

    return (
        <RaffleDraw
            eventId={eventId}
            eventName={eventTitle}
            participants={participants}
            prizes={prizes}
            onWinnerRecorded={handleWinnerRecorded}
        />
    );
}
