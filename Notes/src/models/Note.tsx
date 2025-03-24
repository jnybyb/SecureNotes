export interface Note {
    id?: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface EncryptedNoteData {
    cipher: string;
    iv: string;
    salt: string;
}

export interface EncryptedNote {
    id?: number;
    title: EncryptedNoteData;
    content: EncryptedNoteData;
    createdAt: string;
    updatedAt?: string;
}
