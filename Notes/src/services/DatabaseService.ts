import { open } from 'react-native-quick-sqlite';
import { Note, EncryptedNote } from '../models/Note';
import { Platform } from 'react-native';
import EncryptionService from './EncryptionService';

class DatabaseService {
    private static dbInstance: any = null;
    private static readonly DB_NAME = 'notes.db';

    static async getDatabaseInstance() {
        if (!this.dbInstance) {
            try {
                console.log('Creating database instance...');
                
                // Close any existing connections first
                await this.closeDatabase();
                
                this.dbInstance = open({
                    name: this.DB_NAME,
                    location: 'databases'  // Keep this in the databases directory
                });

                console.log('Database instance created');
                await this.initializeDatabase();
                return this.dbInstance;
            } catch (error) {
                console.error('Database creation failed:', error);
                throw new Error('Failed to create database');
            }
        }
        return this.dbInstance;
    }

    private static async initializeDatabase() {
        try {
            const db = this.dbInstance;
            console.log('Creating notes table...');
            
            await db.executeAsync(`
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title_cipher TEXT NOT NULL,
                    title_iv TEXT NOT NULL,
                    title_salt TEXT NOT NULL,
                    content_cipher TEXT NOT NULL,
                    content_iv TEXT NOT NULL,
                    content_salt TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
            `);
            
            console.log('Notes table created successfully');
        } catch (error) {
            console.error('Table creation failed:', error);
            throw error;
        }
    }

    public static async addNote(title: string, content: string): Promise<void> {
        const db = await this.getDatabaseInstance();
        const now = new Date().toISOString();

        try {
            // Encrypt title and content
            const encryptedTitle = await EncryptionService.encryptData(title);
            const encryptedContent = await EncryptionService.encryptData(content);

            await db.executeAsync(
                `INSERT INTO notes (
                    title_cipher, title_iv, title_salt,
                    content_cipher, content_iv, content_salt,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    encryptedTitle.cipher, encryptedTitle.iv, encryptedTitle.salt,
                    encryptedContent.cipher, encryptedContent.iv, encryptedContent.salt,
                    now, now
                ]
            );
            console.log('Note added successfully');
        } catch (error) {
            console.error('Failed to add encrypted note:', error);
            throw error;
        }
    }

    public static async getNotes(): Promise<Note[]> {
        const db = await this.getDatabaseInstance();
        try {
            const result = await db.executeAsync(
                'SELECT * FROM notes ORDER BY created_at DESC',
                []
            );

            if (!result?.rows?._array) return [];

            const notes: Note[] = [];
            for (const row of result.rows._array) {
                try {
                    const decryptedTitle = await EncryptionService.decryptData(
                        row.title_cipher,
                        row.title_iv,
                        row.title_salt
                    );
                    const decryptedContent = await EncryptionService.decryptData(
                        row.content_cipher,
                        row.content_iv,
                        row.content_salt
                    );

                    notes.push({
                        id: row.id,
                        title: decryptedTitle,
                        content: decryptedContent,
                        createdAt: row.created_at,
                        updatedAt: row.updated_at
                    });
                } catch (error) {
                    console.error(`Failed to decrypt note ${row.id}:`, error);
                    // Skip corrupted notes but continue processing others
                    continue;
                }
            }
            return notes;
        } catch (error) {
            console.error('Failed to get notes:', error);
            throw error;
        }
    }

    public static async deleteNote(id: number): Promise<void> {
        const db = await this.getDatabaseInstance();
        try {
            await db.executeAsync('DELETE FROM notes WHERE id = ?', [id]);
            console.log('Note deleted successfully');
        } catch (error) {
            console.error('Failed to delete note:', error);
            throw error;
        }
    }

    public static async updateNote(id: number, title: string, content: string): Promise<void> {
        const db = await this.getDatabaseInstance();
        const now = new Date().toISOString();

        try {
            const encryptedTitle = await EncryptionService.encryptData(title);
            const encryptedContent = await EncryptionService.encryptData(content);

            await db.executeAsync(
                `UPDATE notes SET 
                    title_cipher = ?, title_iv = ?, title_salt = ?,
                    content_cipher = ?, content_iv = ?, content_salt = ?,
                    updated_at = ?
                WHERE id = ?`,
                [
                    encryptedTitle.cipher, encryptedTitle.iv, encryptedTitle.salt,
                    encryptedContent.cipher, encryptedContent.iv, encryptedContent.salt,
                    now, id
                ]
            );
            console.log(`Note ID ${id} updated successfully`);
        } catch (error) {
            console.error('Failed to update encrypted note:', error);
            throw error;
        }
    }
    
    public static async closeDatabase(): Promise<void> {
        if (this.dbInstance) {
            try {
                await this.dbInstance.close();
                this.dbInstance = null;
                console.log('Database closed successfully');
            } catch (error) {
                console.error('Failed to close database:', error);
            }
        }
    }
}

export default DatabaseService;
