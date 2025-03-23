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
    TextInput,
} from 'react-native';
import NotePresenter from '../presenters/NotePresenter';
import { Note } from '../models/Note';
import AddNoteScreen from './AddNewNote';
import { AuthenticationService } from '../services/AuthenticationService';
import SecurityScreen from './SecurityScreen';

const NoteList: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [addScreenVisible, setAddScreenVisible] = useState(false);
    const [showSecurityScreen, setShowSecurityScreen] = useState(false);
    const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<number | null>(null);
    const [pendingViewNoteId, setPendingViewNoteId] = useState<number | null>(null);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    
    const [presenter] = useState(() => new NotePresenter({
        onNotesLoaded: setNotes,
        onNoteDeleted: (id) => setNotes(prev => prev.filter(note => note.id !== id)),
        onError: (error) => Alert.alert('Error', error),
    }));

    useEffect(() => {
        authenticateAndLoadNotes();
    }, [presenter]);

    const authenticateAndLoadNotes = async () => {
        const authenticated = await AuthenticationService.authenticate();
        if (authenticated) {
            presenter.loadNotes();
        } else {
            // This is for initial app load - you might want to handle differently
            setShowSecurityScreen(true);
        }
    };

    const handleNotePress = (note: Note) => {
        // Set the pending note to view and require authentication
        setPendingViewNoteId(note.id!);
        setSelectedNote(null); // Clear any previously selected note
        setShowSecurityScreen(true);
    };

    const handleDeleteNote = async (id: number) => {
        // First confirm if the user wants to delete the note
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // Store the ID and show security screen for authentication
                        setPendingDeleteNoteId(id);
                        setShowSecurityScreen(true);
                    }
                }
            ]
        );
    };

    const handleAddNewNote = () => {
        // Set up for a new note, require authentication first
        setSelectedNote(null);
        setShowSecurityScreen(true);
    };

    const handleAuthenticated = () => {
        // User has been authenticated, proceed with operation
        setShowSecurityScreen(false);
        
        if (pendingDeleteNoteId !== null) {
            // Handle delete operation
            presenter.deleteNote(pendingDeleteNoteId);
            setPendingDeleteNoteId(null);
        } else if (pendingViewNoteId !== null) {
            // Handle view operation - find the note and display it
            const noteToView = notes.find(note => note.id === pendingViewNoteId);
            if (noteToView) {
                setSelectedNote(noteToView);
                setAddScreenVisible(true);
            }
            setPendingViewNoteId(null);
        } else {
            // If no pending operations, it means we're authenticating for initial load
            // or for adding a new note
            presenter.loadNotes();
            
            // If we intended to add a new note, open the screen
            if (selectedNote === null && !pendingDeleteNoteId && !pendingViewNoteId) {
                setAddScreenVisible(true);
            }
        }
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
                        onLongPress={() => handleDeleteNote(item.id!)}
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
                        setAddScreenVisible(false);
                        setSelectedNote(null);
                    } catch {
                        Alert.alert('Error', 'Failed to save note');
                    }
                }}
            />

            <Modal
                visible={showSecurityScreen}
                animationType="fade"
                transparent={false}
            >
                <SecurityScreen onAuthenticated={handleAuthenticated} />
            </Modal>
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
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    addButton: {
        position: 'absolute',
        right: 30,
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
    },
    pinInput: {
        width: '100%',
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#000',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NoteList;
