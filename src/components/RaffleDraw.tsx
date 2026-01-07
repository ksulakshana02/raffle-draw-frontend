"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Gift, Sparkles, PartyPopper, Award } from "lucide-react";
import { Participant, Gift as Prize } from "@/types";
import api from "@/lib/api";
import confetti from "canvas-confetti";

import { getImageUrl } from "@/lib/utils";

interface RaffleDrawProps {
    eventId: string;
    eventName?: string;
    participants: Participant[];
    prizes: Prize[];
    onWinnerRecorded: (userId: number) => void;
}

export function RaffleDraw({ eventId, eventName = "Grand Raffle Draw", participants, prizes, onWinnerRecorded }: RaffleDrawProps) {

    const [hasStarted, setHasStarted] = useState(false);

    const sortedPrizes = [...prizes].sort((a, b) => b.rank - a.rank);
    const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);

    const [allWinners, setAllWinners] = useState<Set<number>>(new Set());
    const [winner, setWinner] = useState<Participant | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);

    // Refs for animation
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const speedRef = useRef(50);
    const autoProgressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentPrize = sortedPrizes[currentPrizeIndex];
    const eligibleParticipants = participants.filter(p => !allWinners.has(p.id));

    // Cleanup animation on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (autoProgressTimeoutRef.current) clearTimeout(autoProgressTimeoutRef.current);
        };
    }, []);

    const shuffle = () => {
        if (eligibleParticipants.length === 0) return;

        setSelectedIndex((prev) => (prev + 1) % eligibleParticipants.length);
        speedRef.current = Math.min(speedRef.current * 1.05, 500);
        timeoutRef.current = setTimeout(shuffle, speedRef.current);
    };

    const handleStartDraw = () => {
        if (eligibleParticipants.length === 0) {
            alert("No eligible participants remaining!");
            return;
        }

        setIsAnimating(true);
        setWinner(null);
        speedRef.current = 50;

        // Start shuffling
        shuffle();

        // Duration of the spin (3 seconds as per new design preference, originally 5s)
        const duration = 3000;

        // Stop logic
        setTimeout(() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsAnimating(false);

            // Pick Winner from eligible participants only
            const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
            const selectedWinner = eligibleParticipants[randomIndex];
            setWinner(selectedWinner);

            // Add to winners set
            setAllWinners(prev => new Set([...prev, selectedWinner.id]));

            // Trigger Confetti
            triggerConfetti();

            // Record winner
            if (currentPrize && selectedWinner) {
                api.post('/raffle/record-winner', {
                    eventId,
                    giftId: currentPrize.id,
                    userId: selectedWinner.id
                }).then(() => {
                    onWinnerRecorded(selectedWinner.id);
                }).catch(console.error);
            }

            // Auto-progress is disabled for manual flow
        }, duration);
    };

    const handleAutoProgress = () => {
        if (currentPrizeIndex < sortedPrizes.length - 1) {
            // Move to next prize
            setCurrentPrizeIndex(prev => prev + 1);
            setWinner(null);
        } else {
            // All prizes drawn - show completion
            setIsCompleted(true);
        }
    };

    const handleNextPrize = () => {
        // Clear auto-progress timeout if user manually clicks
        if (autoProgressTimeoutRef.current) {
            clearTimeout(autoProgressTimeoutRef.current);
        }
        handleAutoProgress();
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const getPlaceColor = (rank: number) => {
        if (rank === 1) return "from-yellow-400 to-yellow-600 border-yellow-300 shadow-yellow-500/50";
        if (rank === 2) return "from-gray-300 to-gray-500 border-gray-300 shadow-gray-500/50";
        return "from-orange-400 to-orange-600 border-orange-300 shadow-orange-500/50";
    };

    const getPlaceText = (rank: number) => {
        if (rank === 1) return "1st Place";
        if (rank === 2) return "2nd Place";
        if (rank === 3) return "3rd Place";
        return `${rank}th Place`;
    };

    // --- START PAGE RENDER ---
    if (!hasStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
                }}
            >
                {/* Background Pattern/Vectors */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* We can reproduce the 'burst' effect or scattered stars using mapped items */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute opacity-20"
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                                rotate: Math.random() * 360,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Sparkles className="text-white w-12 h-12" />
                        </motion.div>
                    ))}
                </div>

                {/* Top Branding Tag / Logo Container */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[360px] h-[320px] bg-white rounded-b-[30px] shadow-lg flex items-center justify-center z-20">
                    <div className="text-center pt-16">
                        {/* Placeholder for SLT-MOBITEL logo. Using a relevant placeholder or text if image missing */}
                        <img
                            src="/slt-logo.png"
                            alt="SLT Mobitel"
                            className="w-48 mx-auto"
                        />
                    </div>
                </div>

                <div className="text-center z-30 px-8 mt-48">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="font-bold text-white mb-4 drop-shadow-xl"
                        style={{ fontSize: "72px", lineHeight: "72px", fontFamily: "Arial, sans-serif" }}
                    >
                        {eventName}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.9 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="text-white mb-16 drop-shadow-md"
                        style={{ fontSize: "30px", fontFamily: "Arial, sans-serif" }}
                    >
                        Grand Raffle Draw
                    </motion.p>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setHasStarted(true);
                            setTimeout(() => handleStartDraw(), 500);
                        }}
                        className="px-16 py-6 text-white font-bold shadow-2xl transition-all duration-300"
                        style={{
                            background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                            borderRadius: "100px",
                            fontSize: "30px",
                            fontFamily: "Arial, sans-serif",
                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                    >
                        START DRAW
                    </motion.button>
                </div>
            </div>
        );
    }

    // --- COMPLETION PAGE RENDER ---
    if (isCompleted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                    background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
                }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute opacity-20"
                            initial={{
                                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                                rotate: Math.random() * 360,
                                scale: Math.random() * 0.5 + 0.5
                            }}
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.3, 0.1]
                            }}
                            transition={{
                                duration: Math.random() * 10 + 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        >
                            <Sparkles className="text-white w-12 h-12" />
                        </motion.div>
                    ))}
                </div>

                {/* Top Branding Tag / Logo Container */}
                <motion.div
                    initial={{ y: -300 }}
                    animate={{ y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 bg-white flex items-center justify-center z-20 shadow-xl"
                    style={{
                        width: "359px",
                        height: "330px",
                        borderRadius: "0px 0px 30px 30px",
                        top: "-80px" // Adjusted to hang as per design
                    }}
                >
                    <div className="mt-40">
                        {/* Using the same logo path as Start Page */}
                        <img
                            src="/slt-logo.png"
                            alt="SLT Mobitel"
                            className="w-64 mx-auto"
                        />
                    </div>
                </motion.div>

                <div className="z-10 text-center mt-32 flex flex-col items-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white font-bold mb-4 drop-shadow-xl"
                        style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "96px",
                            lineHeight: "96px"
                        }}
                    >
                        Congratulations!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-white mb-24 drop-shadow-md"
                        style={{
                            fontFamily: "Arial, sans-serif",
                            fontSize: "36px",
                            lineHeight: "40px"
                        }}
                    >
                        Thank you to all participants!
                    </motion.p>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="bg-white font-bold transition-transform flex items-center justify-center cursor-pointer"
                        style={{
                            width: "228px",
                            height: "84px",
                            borderRadius: "100px",
                            color: "#009689",
                            fontSize: "30px",
                            fontFamily: "Arial, sans-serif",
                            boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)"
                        }}
                    >
                        Restart
                    </motion.button>
                </div>
            </div>
        );
    }

    if (!currentPrize && !isCompleted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white/50">No Prizes Available</h1>
            </div>
        );
    }

    // --- MAIN DRAW PAGE RENDER ---
    return (
        <div className="min-h-screen flex flex-col items-center relative overflow-hidden p-8"
            style={{
                background: "linear-gradient(135.01deg, #51B749 -1.51%, #253EA3 49.62%, #01B4EC 105.88%)"
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute opacity-20"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                            rotate: Math.random() * 360,
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.3, 0.1]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        <Sparkles className="text-white w-12 h-12" />
                    </motion.div>
                ))}
            </div>

            <div className="z-10 w-full max-w-7xl flex flex-col h-full">
                {/* Header - Consistent with Start Page */}
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 mt-8"
                >
                    <h1 className="font-bold text-white mb-2 drop-shadow-xl"
                        style={{ fontSize: "64px", lineHeight: "1.1", fontFamily: "Arial, sans-serif" }}
                    >
                        {eventName}
                    </h1>
                    <p className="text-white text-2xl font-normal drop-shadow-md" style={{ fontFamily: "Arial, sans-serif" }}>
                        Grand Raffle Draw
                    </p>
                </motion.div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-[350px]">

                    {/* Winner Display (Overlay) */}
                    <AnimatePresence>
                        {winner && !isAnimating && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 z-50 flex items-center justify-center items-center"
                            >
                                {/* Winner Card */}
                                <div className="bg-white rounded-[24px] shadow-2xl p-12 max-w-4xl w-full relative">
                                    {/* Rank Badge */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                        <div className="px-12 py-3 rounded-full shadow-lg flex items-center gap-3"
                                            style={{
                                                background: "linear-gradient(90deg, #FF8904 0%, #F54900 100%)",
                                            }}
                                        >
                                            <Trophy className="text-white w-8 h-8" />
                                            <span className="text-white font-bold text-3xl font-arial">
                                                {getPlaceText(currentPrize.rank)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-stretch justify-center gap-16 mt-8">
                                        {/* Winner Section */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 bg-gradient-to-r from-[#51B749] to-[#01B4EC] rounded-full blur-md opacity-50"></div>
                                                <div className="w-56 h-56 rounded-full border-[8px] border-white shadow-xl overflow-hidden relative z-10 bg-gray-100">
                                                    <img
                                                        src={getImageUrl(winner.photoUrl) || `https://ui-avatars.com/api/?name=${winner.name}`}
                                                        alt={winner.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-bold text-[#1E2939] mb-1 font-arial">{winner.name}</h3>
                                            <p className="text-[#4A5565] text-xl font-arial">Winner!</p>
                                        </div>

                                        {/* Prize Section */}
                                        <div className="flex flex-col items-center">
                                            <div className="relative mb-6">
                                                <Gift className="absolute -right-4 -top-4 w-12 h-12 text-[#F6339A] z-20 animate-bounce" />
                                                <div className="w-56 h-56 rounded-2xl bg-white border-4 border-[#FCCEE8] shadow-[0_25px_50px_-12px_rgba(25,50,211,0.25)] flex items-center justify-center p-4 relative z-10">
                                                    <img
                                                        src={getImageUrl(currentPrize.imageUrl)}
                                                        alt={currentPrize.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>
                                            <h3 className="text-3xl font-bold text-white">{currentPrize.name}</h3>
                                            <p className="text-[#4A5565] text-lg font-arial">Prize</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-12 text-center">
                                        {currentPrizeIndex >= sortedPrizes.length - 1 ? (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setIsCompleted(true)}
                                                className="px-20 py-6 text-white font-bold rounded-full shadow-2xl uppercase tracking-wider"
                                                style={{
                                                    background: "linear-gradient(90deg, #00C853 0%, #64DD17 100%)", // Green for DONE
                                                    fontSize: "30px",
                                                    fontFamily: "Arial, sans-serif"
                                                }}
                                            >
                                                DONE
                                            </motion.button>
                                        ) : (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleNextPrize}
                                                className="px-20 py-6 text-white font-bold rounded-full shadow-2xl uppercase tracking-wider"
                                                style={{
                                                    background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                                    fontSize: "30px",
                                                    fontFamily: "Arial, sans-serif"
                                                }}
                                            >
                                                NEXT DRAW
                                            </motion.button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Participants Grid - Always visible initially, fades when winner shown */}
                    <motion.div
                        animate={{ opacity: (winner && !isAnimating) ? 0.1 : 1, filter: (winner && !isAnimating) ? "blur(10px)" : "blur(0px)" }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-5 gap-6">
                            {/* We show a fixed number of slots or eligible participants */}
                            {eligibleParticipants.slice(0, 10).map((participant, index) => {
                                // Determine if this card is currently 'active' in the shuffle animation
                                const isActive = isAnimating && (selectedIndex % 10 === index);

                                return (
                                    <motion.div
                                        key={participant.id}
                                        className={`relative group rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-200 border-2 ${isActive ? 'border-yellow-400 bg-yellow-400/20 scale-105 z-10 shadow-[0_0_30px_rgba(253,199,0,0.5)]' : 'border-white/20 bg-white/10 hover:bg-white/20'}`}
                                        style={{ aspectRatio: "0.8" }}
                                    >
                                        <div className="absolute inset-0 p-3 flex flex-col items-center">
                                            <div className="w-full flex-1 rounded-xl overflow-hidden mb-3 bg-black/20 relative">
                                                <img
                                                    src={getImageUrl(participant.photoUrl) || `https://ui-avatars.com/api/?name=${participant.name}`}
                                                    alt={participant.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className={`w-full py-2 rounded-lg text-center ${isActive ? 'bg-yellow-400' : 'bg-white/20'}`}>
                                                <p className={`font-bold text-sm truncate px-2 ${isActive ? 'text-black' : 'text-white'}`}>
                                                    {participant.name}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Control Bar */}
                <div className="h-32 flex items-center justify-center">
                    {!winner && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStartDraw}
                            disabled={isAnimating}
                            className="px-16 py-5 text-2xl font-bold rounded-full text-white shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: "linear-gradient(90deg, #FDC700 0%, #FF6900 100%)",
                                boxShadow: "0px 10px 30px rgba(253, 199, 0, 0.3)"
                            }}
                        >
                            {isAnimating ? "SPINNING..." : "START SPIN"}
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
