// Represents a decrypted note
export interface Note {
    id?: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

// Structure for encrypted data fields
export interface EncryptedNoteData {
    cipher: string;
    iv: string;
    salt: string;
}

// Represents a note with encrypted title and content
export interface EncryptedNote {
    id?: number;
    title: EncryptedNoteData;
    content: EncryptedNoteData;
    createdAt: string;
    updatedAt?: string;
}
