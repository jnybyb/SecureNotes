export interface Note {
    id?: number;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface EncryptedNote extends Note {
    iv: string;
    salt: string;
}
