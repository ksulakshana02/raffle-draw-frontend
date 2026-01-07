"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { User } from "@/types";
import { Plus, QrCode, Trash2, X } from "lucide-react";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "@/lib/utils";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewQrUser, setViewQrUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/users');
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('location', location);
        if (photo) formData.append('photo', photo);

        try {
            await api.post('/users', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsAddModalOpen(false);
            setName("");
            setLocation("");
            setPhoto(null);
            fetchUsers();
        } catch (error) {
            console.error("Failed to create user", error);
            alert("Failed to create user");
        }
    };

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Are you sure? This will remove them from all events.")) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert("Failed to delete user");
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Manager
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map(user => (
                        <div key={user.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group">
                            <div className="relative h-48 bg-gray-200">
                                <img
                                    src={getImageUrl(user.photoUrl) || `https://ui-avatars.com/api/?name=${user.name}`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-gray-800 truncate">{user.name}</h3>
                                <p className="text-sm text-gray-500 mb-4">{user.location || "No Location"}</p>
                                <button
                                    onClick={() => setViewQrUser(user)}
                                    className="w-full flex items-center justify-center gap-2 py-2 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                                >
                                    <QrCode className="w-4 h-4" />
                                    View QR Code
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add User Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-xl font-bold">Add New Manager</h2>
                                <button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                                    <input
                                        type="text"
                                        required
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                        placeholder="Enter location"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setPhoto(e.target.files?.[0] || null)}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View QR Modal */}
            <AnimatePresence>
                {viewQrUser && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center"
                        >
                            <div className="p-6 relative">
                                <button
                                    onClick={() => setViewQrUser(null)}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <h2 className="text-2xl font-bold mb-2">{viewQrUser.name}</h2>
                                <p className="text-gray-500 mb-6">Scan to mark attendance</p>
                                <div className="flex justify-center p-4 bg-white">
                                    <QRCode value={viewQrUser.id.toString()} />
                                </div>
                                <p className="text-xs text-gray-400 mt-4">User ID: {viewQrUser.id}</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
