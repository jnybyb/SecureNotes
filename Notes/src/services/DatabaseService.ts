import { open } from 'react-native-quick-sqlite';
import { Note } from '../models/Note';
import { Platform } from 'react-native';

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
                throw new Error('Failed to create database: ' + error);
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
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
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
            await db.executeAsync(
                'INSERT INTO notes (title, content, created_at, updated_at) VALUES (?, ?, ?, ?)',
                [title, content, now, now]
            );
            console.log('Note added successfully');
        } catch (error) {
            console.error('Failed to add note:', error);
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

            return result.rows._array.map((row: any) => ({
                id: row.id,
                title: row.title,
                content: row.content,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
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
        try {
            console.log(`DatabaseService updating note ID: ${id}`);
            const db = await this.getDatabaseInstance();
            const now = new Date().toISOString();
            
            // Log the SQL and parameters for debugging
            console.log('Update SQL:', 'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?');
            console.log('Parameters:', [title, content, now, id]);
            
            const result = await db.executeAsync(
                'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?',
                [title, content, now, id]
            );
            
            // Check if any rows were actually updated
            console.log('Update result:', result);
            if (result && result.rowsAffected === 0) {
                console.warn('No rows were updated. Note might not exist with ID:', id);
            } else {
                console.log(`Note ID ${id} updated successfully`);
            }
        } catch (error) {
            console.error('Error updating note:', error);
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
