"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Event, User } from "@/types";
import { QrCode, UserPlus, Check, X, Gift as GiftIcon, Trash2 } from "lucide-react";
import QrScannerModal from "@/components/QrScannerModal";
import Link from 'next/link';
import { getImageUrl } from "@/lib/utils";

export default function EventDetailsPage() {
    const { id: eventId } = useParams();
    const [event, setEvent] = useState<Event | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [participants, setParticipants] = useState<User[]>([]); // Users engaged in event

    // UI States
    const [scanning, setScanning] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);

    // Forms
    const [giftForm, setGiftForm] = useState({ name: '', imageUrl: '', rank: '1' });
    const [isGiftSubmitting, setIsGiftSubmitting] = useState(false);

    // Participant Selection
    const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
    const [isAddingParticipants, setIsAddingParticipants] = useState(false);

    useEffect(() => {
        fetchEventDetails();
        fetchUsers();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            const { data } = await api.get(`/events/${eventId}`);
            setEvent(data);

            // Extract participants from attendance
            // Assuming backend returns attendances included
            if (data.attendances) {
                const participantList: User[] = data.attendances.map((a: any) => ({
                    ...a.user,
                    status: a.status // Attach attendance status
                }));
                setParticipants(participantList);
            }
        } catch (error) {
            console.error("Error fetching event", error);
        }
    };

    const fetchUsers = async () => {
        const { data } = await api.get('/users');
        setAllUsers(data);
    }

    const availableUsers = allUsers.filter(u => !participants.some(p => p.id === u.id));

    const handleAddGift = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGiftSubmitting(true);
        try {
            await api.post(`/events/${eventId}/gifts`, giftForm);
            setGiftForm({ name: '', imageUrl: '', rank: '1' });
            fetchEventDetails();
        } catch (error) {
            console.error(error);
            alert("Failed to add gift");
        } finally {
            setIsGiftSubmitting(false);
        }
    };

    const handleAddParticipants = async () => {
        setIsAddingParticipants(true);
        try {
            await api.post(`/events/${eventId}/participants`, {
                userIds: Array.from(selectedUserIds)
            });
            setIsAddModalOpen(false);
            setSelectedUserIds(new Set());
            fetchEventDetails(); // Refresh list
        } catch (error) {
            console.error(error);
            alert("Failed to add participants");
        } finally {
            setIsAddingParticipants(false);
        }
    }

    const toggleAttendance = async (userId: number, isPresent: boolean) => {
        if (isPresent) {
            try {
                // Determine current status? Logic mainly toggles TO present
                await api.post('/attendance/mark', { eventId, userId });
                fetchEventDetails(); // Reload to update status in UI
            } catch (error) {
                console.error(error);
                alert("Failed to mark attendance");
            }
        } else {
            alert("Cannot unmark attendance yet.");
        }
    };

    const handleScan = async (scannedId: string | null) => {
        if (scannedId) {
            const userId = parseInt(scannedId);
            if (!isNaN(userId)) {
                await api.post('/attendance/mark', { eventId, userId });
                fetchEventDetails();
                setScanning(false);
                alert("Attendance Marked!");
            }
        }
    };

    if (!event) return <div className="p-8">Loading Event...</div>;

    const giftsByRank = (rank: number) => event.gifts?.find(g => g.rank === rank);

    return (
        <div className="p-8">
            <header className="mb-8 border-b pb-8">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
                        <p className="text-gray-500">Date: {new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-gray-500 font-mono mt-1">Enrollment Key: {event.enrollmentKey}</p>
                    </div>
                    <Link href={`/events/${event.id}/raffle`} target="_blank" className="px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 shadow-lg transition-transform hover:scale-105">
                        Launch Raffle Page &rarr;
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* GIFTS MANAGEMENT */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            🎁 Prize Configuration
                        </h2>
                        <button
                            onClick={() => setIsGiftModalOpen(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                        >
                            <GiftIcon className="w-4 h-4" />
                            Add Prize
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(event.gifts && event.gifts.length > 0) ? (
                            event.gifts.sort((a, b) => a.rank - b.rank).map((gift) => (
                                <div key={gift.id} className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md ${gift.rank === 1 ? 'bg-yellow-500' :
                                        gift.rank === 2 ? 'bg-gray-400' :
                                            gift.rank === 3 ? 'bg-orange-500' : 'bg-slate-500'
                                        }`}>
                                        #{gift.rank}
                                    </div>
                                    <div className="flex-1 flex gap-4 items-center">
                                        <img src={getImageUrl(gift.imageUrl)} className="w-16 h-16 object-cover rounded-md border" />
                                        <div>
                                            <p className="font-bold text-lg">{gift.name}</p>
                                            <p className="text-xs text-gray-400">ID: {gift.id}</p>
                                        </div>
                                    </div>
                                    <button className="text-red-500 hover:text-red-700 p-2" title="Delete functionality pending">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                                No prizes configured yet. Click "Add Prize" to start.
                            </div>
                        )}
                    </div>
                </section>

                {/* ATTENDANCE MANAGEMENT */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            📝 Participation
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                            >
                                <UserPlus className="w-4 h-4" />
                                Add Users
                            </button>
                            <button
                                onClick={() => setScanning(true)}
                                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800"
                            >
                                <QrCode className="w-4 h-4" />
                                Scan QR
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow border h-[600px] overflow-y-auto">
                        {participants.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                No participants invited yet. Click "Add Users" to start.
                            </div>
                        ) : (
                            participants.map((user: any) => {
                                const isPresent = user.status === 'PRESENT';
                                return (
                                    <div key={user.id} className={`flex items-center justify-between p-4 border-b hover:bg-gray-50 ${isPresent ? 'bg-green-50' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                <img
                                                    src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Status: {user.status}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleAttendance(user.id, !isPresent)}
                                            className={`px-4 py-1 rounded-full text-sm font-bold border transition-colors ${isPresent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                        >
                                            {isPresent ? 'Present' : 'Mark Present'}
                                        </button>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </section>
            </div>

            {/* ADD PARTICIPANTS MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Add Participants</h2>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {availableUsers.length === 0 ? (
                                <p className="text-center text-gray-500">All users are already invited.</p>
                            ) : (
                                <div className="space-y-2">
                                    {availableUsers.map(user => {
                                        const isSelected = selectedUserIds.has(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => {
                                                    const next = new Set(selectedUserIds);
                                                    if (isSelected) next.delete(user.id);
                                                    else next.add(user.id);
                                                    setSelectedUserIds(next);
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                                    <img
                                                        src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
                            <span className="font-bold text-gray-600">{selectedUserIds.size} Selected</span>
                            <button
                                onClick={handleAddParticipants}
                                disabled={selectedUserIds.size === 0 || isAddingParticipants}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105"
                            >
                                {isAddingParticipants ? 'Adding...' : 'Add Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GIFT MODAL */}
            {isGiftModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-xl font-bold">Add Prize</h2>
                            <button onClick={() => setIsGiftModalOpen(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={(e) => {
                            handleAddGift(e).then(() => setIsGiftModalOpen(false));
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Rank/Place</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-lg text-gray-900 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    value={giftForm.rank}
                                    onChange={e => setGiftForm({ ...giftForm, rank: e.target.value })}
                                    placeholder="1"
                                />
                                <p className="text-xs text-gray-500 mt-2">1 = 1st Place, 2 = 2nd Place, etc. Multiple gifts can have same rank.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Gift Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    value={giftForm.name}
                                    onChange={e => setGiftForm({ ...giftForm, name: e.target.value })}
                                    placeholder="e.g. Apple Watch Ultra"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-2 border-gray-300 px-4 py-2.5 rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    value={giftForm.imageUrl}
                                    onChange={e => setGiftForm({ ...giftForm, imageUrl: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <button disabled={isGiftSubmitting} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]">
                                {isGiftSubmitting ? 'Adding...' : 'Add Gift'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {scanning && (
                <QrScannerModal
                    onScan={handleScan}
                    onClose={() => setScanning(false)}
                />
            )}
        </div>
    );
}
