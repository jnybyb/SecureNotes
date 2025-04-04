import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    Modal,
} from 'react-native';
import NotePresenter from '../presenters/NotePresenter';
import { Note } from '../models/Note';
import AddNoteScreen from './AddNewNote';
import SecurityScreen from './SecurityScreen'; // Import SecurityScreen

const NoteList: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [addScreenVisible, setAddScreenVisible] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [securityScreenVisible, setSecurityScreenVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'view' | 'delete', note: Note | null }>({ type: 'view', note: null });
    
    const [presenter] = useState(() => new NotePresenter({
        onNotesLoaded: setNotes,
        onNoteDeleted: (id) => setNotes(prev => prev.filter(note => note.id !== id)),
        onError: (error) => Alert.alert('Error', error),
    }));

    useEffect(() => {
        // Load notes directly without authentication
        presenter.loadNotes();
    }, [presenter]);

    const handleNotePress = (note: Note) => {
        // Set the pending action to view the note
        setPendingAction({ type: 'view', note });
        
        // Show authentication screen
        setSecurityScreenVisible(true);
    };

    const handleDeleteNote = async (id: number) => {
        const noteToDelete = notes.find(note => note.id === id);
        
        if (!noteToDelete) return;
        
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setPendingAction({ type: 'delete', note: noteToDelete });
                        setSecurityScreenVisible(true);
                    }
                }
            ]
        );
    };

    const handleAddNewNote = () => {
        // For adding new notes, we don't need authentication
        setSelectedNote(null);
        setAddScreenVisible(true);
    };

    const handleAuthenticated = () => {
        // Hide security screen
        setSecurityScreenVisible(false);
        
        // Process the pending action after authentication
        if (pendingAction.type === 'view' && pendingAction.note) {
            // Open the note for viewing/editing
            setSelectedNote(pendingAction.note);
            setAddScreenVisible(true);
        } else if (pendingAction.type === 'delete' && pendingAction.note && pendingAction.note.id) {
            // Delete the note
            presenter.deleteNote(pendingAction.note.id);
        }
        
        // Clear the pending action
        setPendingAction({ type: 'view', note: null });
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            return 'N/A';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image 
                        source={require('../assets/icons/NoteLogo.png')} 
                        style={styles.logoIcon}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>Notes</Text>
                </View>
            </View>

            <FlatList
                data={notes}
                keyExtractor={(item) => item.id?.toString() || ''}
                contentContainerStyle={styles.listContainer}
                ListHeaderComponent={() => (
                    <View style={styles.listTitleContainer}>
                        <Text style={styles.listTitle}>All Notes</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.noteItem}
                        onPress={() => handleNotePress(item)}
                        onLongPress={() => item.id && handleDeleteNote(item.id)}
                    >
                        <Text style={styles.noteTitle}>{item.title}</Text>
                        <Text style={styles.noteDate}>
                            Created {formatDate(item.createdAt)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddNewNote}
            >
                <Image 
                    source={require('../assets/icons/add.png')}
                    style={styles.addButtonIcon}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {/* Security Screen Modal */}
            <Modal
                visible={securityScreenVisible}
                animationType="slide"
                transparent={false}
            >
                <SecurityScreen 
                    onAuthenticated={handleAuthenticated} 
                    mode={pendingAction.type === 'delete' ? 'delete' : 'normal'}
                />
            </Modal>

            {/* Add/Edit Note Screen */}
            <AddNoteScreen
                visible={addScreenVisible}
                onClose={() => {
                    setAddScreenVisible(false);
                    setSelectedNote(null); // Clear selected note on close
                }}
                note={selectedNote}
                onSave={async (title, content, noteId) => {
                    try {
                        if (noteId) {
                            // If noteId exists, we're editing an existing note
                            await presenter.updateNote(noteId, title, content);
                        } else {
                            // Otherwise, we're adding a new note
                            await presenter.addNote(title, content);
                        }
                        // AddNoteScreen will handle showing the success message and closing
                    } catch {
                        Alert.alert('Error', 'Failed to save note');
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 35,
        height: 35,
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '600',
        color: '#000',
        includeFontPadding: false,
    },
    listContainer: {
        padding: 20,
        marginTop: 10,
    },
    listTitleContainer: {
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#000',
        marginLeft: 5,
    },
    noteItem: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        padding: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    noteTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 8,
        includeFontPadding: false,
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    addButton: {
        position: 'absolute',
        right: 25,
        bottom: 40,
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonIcon: {
        width: 20,
        height: 20,
        tintColor: '#fff',
    },
});

export default NoteList;