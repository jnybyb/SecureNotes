import DatabaseService from '../services/DatabaseService';
import { Note } from '../models/Note';

interface NotePresenterCallbacks {
    onNotesLoaded: (notes: Note[]) => void;
    onNoteDeleted: (id: number) => void;
    onError: (error: string) => void;
}

class NotePresenter {
    private callbacks: NotePresenterCallbacks;

    constructor(callbacks: NotePresenterCallbacks) {
        this.callbacks = callbacks;
    }

    public async loadNotes(): Promise<void> {
        try {
            const notes = await DatabaseService.getNotes();
            this.callbacks.onNotesLoaded(notes);
        } catch (error) {
            this.callbacks.onError('Failed to load notes');
        }
    }

    public async addNote(title: string, content: string): Promise<void> {
        try {
            await DatabaseService.addNote(title, content);
            await this.loadNotes();
        } catch (error) {
            this.callbacks.onError('Failed to add note');
        }
    }

    public async deleteNote(id: number): Promise<void> {
        try {
            await DatabaseService.deleteNote(id);
            this.callbacks.onNoteDeleted(id);
        } catch (error) {
            this.callbacks.onError('Failed to delete note');
        }
    }

    public async updateNote(id: number, title: string, content: string): Promise<void> {
        console.log(`Starting update for note ID: ${id}`);
        console.log(`Title: "${title}", Content length: ${content.length}`);
        
        try {
            // Make sure id is a number
            if (typeof id !== 'number' || isNaN(id)) {
                console.error('Invalid ID:', id);
                this.callbacks.onError('Failed to update note: Invalid ID');
                return;
            }
            
            await DatabaseService.updateNote(id, title, content);
            console.log('Database update successful, reloading notes...');
            await this.loadNotes(); // Reload notes after update
        } catch (error) {
            console.error('Update error:', error);
            this.callbacks.onError('Failed to update note');
        }
    }
}

export default NotePresenter;
