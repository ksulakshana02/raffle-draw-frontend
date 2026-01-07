export interface Admin {
    id: number;
    username: string;
}

export interface User {
    id: number;
    name: string;
    location?: string;
    photoUrl?: string;
    createdAt: string;
}

export interface Event {
    id: number;
    title: string;
    date: string;
    enrollmentKey: string;
    status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
    gifts?: Gift[];
}

export interface Gift {
    id: number;
    name: string;
    imageUrl: string;
    rank: number;
    eventId: number;
}

export interface Participant {
    id: number;
    name: string;
    location?: string;
    photoUrl?: string; // Mapped from User.photoUrl
}
