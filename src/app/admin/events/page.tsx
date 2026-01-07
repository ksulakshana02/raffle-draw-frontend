"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Event } from "@/types";
import { Plus, X, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data } = await api.get('/events');
            setEvents(data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/events', { title, date });
            setIsCreateModalOpen(false);
            setTitle("");
            setDate("");
            fetchEvents();
        } catch (error) {
            console.error("Failed to create event", error);
            alert("Failed to create event");
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Event Management</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Event
                </button>
            </div>

            <div className="grid gap-4">
                {events.map(event => (
                    <Link
                        key={event.id}
                        href={`/admin/events/${event.id}`}
                        className="block bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border border-transparent hover:border-indigo-300 hover:scale-[1.01]"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{event.title}</h3>
                                <div className="flex items-center gap-4 text-gray-500 text-sm">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </span>
                                    <span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                                        Key: {event.enrollmentKey}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Create Event Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold">Create New Event</h2>
                                <button onClick={() => setIsCreateModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="e.g., Q3 Town Hall"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]">
                                        Create Event
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
