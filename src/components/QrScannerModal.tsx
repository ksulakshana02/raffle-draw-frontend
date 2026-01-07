"use client";

import { useState } from 'react';
import QrScanner from 'react-qr-scanner';
import { X } from 'lucide-react';

interface QrScannerModalProps {
    onScan: (data: string | null) => void;
    onClose: () => void;
}

export default function QrScannerModal({ onScan, onClose }: QrScannerModalProps) {
    const handleScan = (data: { text: string } | null) => {
        if (data && data.text) {
            onScan(data.text);
        }
    };

    const handleError = (err: any) => {
        console.error(err);
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full"
            >
                <X className="w-6 h-6" />
            </button>
            <div className="w-full max-w-sm bg-black rounded-2xl overflow-hidden border-2 border-green-500 shadow-2xl relative">
                <QrScanner
                    delay={300}
                    onError={handleError}
                    onScan={handleScan}
                    style={{ width: '100%' }}
                    constraints={{
                        audio: false,
                        video: { facingMode: 'environment' }
                    }}
                />
                <div className="absolute inset-0 border-2 border-green-500/50 pointer-events-none animate-pulse" />
            </div>
            <p className="text-white mt-8 text-center">Point camera at Manager's QR Code</p>
        </div>
    );
}
