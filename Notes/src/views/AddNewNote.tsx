import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
    Modal,
    Alert,
} from 'react-native';
import { Note } from '../models/Note';

interface AddNoteScreenProps {
    visible: boolean;
    onClose: () => void;
    note?: Note | null;
    onSave: (title: string, content: string, noteId?: number) => void;
}

const AddNoteScreen: React.FC<AddNoteScreenProps> = ({ visible, onClose, note, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const slideAnim = React.useRef(new Animated.Value(Dimensions.get('window').width)).current;
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
 
    useEffect(() => {
        if (visible) {
            // If a note is provided, we're in edit mode
            if (note) {
                // Set current values
                setTitle(note.title);
                setContent(note.content);
                
                // Store original values to detect changes
                setOriginalTitle(note.title);
                setOriginalContent(note.content);
            } else {
                // Clear fields when opening for a new note
                setTitle('');
                setContent('');
                setOriginalTitle('');
                setOriginalContent('');
            }
            updateDateTime();
            slideIn();
        } else {
            slideOut();
        }
    }, [visible, note]);

    // Check if content has been modified
    const hasChanges = () => {
        if (note) {
            // For existing notes, compare with original values
            return title !== originalTitle || content !== originalContent;
        } else {
            // For new notes, check if fields are not empty
            return title.trim() !== '' || content.trim() !== '';
        }
    };

    const updateDateTime = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        setCurrentDateTime(dateStr);
    };

    const slideIn = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const slideOut = () => {
        Animated.timing(slideAnim, {
            toValue: Dimensions.get('window').width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleClose = () => {
        // Only show confirm modal if changes were made
        if (hasChanges()) {
            setShowConfirmModal(true);
        } else {
            // No changes, just close immediately
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        slideOut();
        onClose();
        setTitle('');
        setContent('');
        setShowConfirmModal(false);
    };

    const handleSaveClick = () => {
        if (!title.trim() && !content.trim()) {
            handleError('Both title and content are required.');
            return;
        }
        
        if (!title.trim()) {
            handleError('Please add a title to your note.');
            return;
        }
        
        if (!content.trim()) {
            handleError('Please add some content to your note.');
            return;
        }
        
        // Directly proceed to save without security screen
        handleSave();
    };

    const handleSave = async () => {
        // Pass the noteId if we're editing an existing note
        onSave(title, content, note?.id);
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Auto-close success modal after 1.5 seconds
        setTimeout(() => {
            setShowSuccessModal(false);
            resetAndClose();
        }, 1500);
    };

    const handleError = (message: string) => {
        setErrorMessage(message);
        setShowErrorModal(true);
    };

    const renderErrorModal = () => (
        <Modal
            visible={showErrorModal}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {/* Centered header */}
                    <View style={styles.centeredModalHeader}>
                        <Text style={styles.modalTitle}>Incomplete Note</Text>
                    </View>
    
                    <Text style={styles.modalMessage}>
                        {errorMessage}
                    </Text>
    
                    {/* Right-aligned OK button with 10% width */}
                    <View style={styles.errorModalButtonContainer}>
                        <TouchableOpacity 
                            style={styles.smallOkButton}
                            onPress={() => setShowErrorModal(false)}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    // Success Modal
    const renderSuccessModal = () => (
        <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.modalContainer}>
                <View style={styles.successModalContent}>
                    <View style={styles.successIconContainer}>
                        <Image 
                            source={require('../assets/icons/save.png')}
                            style={styles.successIcon}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.successModalTitle}>Note Saved Successfully</Text>
                </View>
            </View>
        </Modal>
    );

    return (
        <>
            <Animated.View 
                style={[
                    styles.container,
                    {
                        transform: [{ translateX: slideAnim }],
                        display: visible ? 'flex' : 'none',
                    }
                ]}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                        <Image 
                            source={require('../assets/icons/back.png')}
                            style={styles.icon}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{note ? 'Edit Note' : 'Add Note'}</Text>
                    <TouchableOpacity 
                        onPress={handleSaveClick} 
                        style={[
                            styles.iconButton
                        ]}
                    >
                        <Image 
                            source={require('../assets/icons/save.png')}
                            style={[
                                styles.iconSave,
                            ]}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Title"
                        placeholderTextColor="#666"
                        value={title}
                        onChangeText={setTitle}
                        multiline
                    />
                    <Text style={styles.dateTimeText}>{currentDateTime}</Text>
                    
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Write your note here..."
                        placeholderTextColor="#666"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        textAlignVertical="top"
                    />
                </View>

                {/* Back Confirmation Modal - Redesigned with centered content */}
                <Modal
                    visible={showConfirmModal}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeaderAligned}>
                                <Text style={styles.modalTitle}>Discard Changes?</Text>
                                <TouchableOpacity 
                                    style={styles.closeModalButton} 
                                    onPress={() => setShowConfirmModal(false)}
                                >
                                    <Text style={styles.closeModalText}>X</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalMessage}>
                                You have unsaved changes. Are you sure you want to discard them?
                            </Text>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity 
                                    style={[styles.modalButton, styles.discardButton]}
                                    onPress={resetAndClose}
                                >
                                    <Text style={styles.modalButtonText}>Discard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[
                                        styles.modalButton, 
                                        styles.saveButton, 
                                        (!title.trim() || !content.trim()) && styles.disabledButton
                                    ]}
                                    onPress={() => {
                                        if (title.trim() && content.trim()) {
                                            // Directly save without security screen
                                            setShowConfirmModal(false);
                                            handleSave();
                                        } else {
                                            // Show error if user tries to save incomplete note from this modal
                                            let errorMsg = '';
                                            if (!title.trim() && !content.trim()) {
                                                errorMsg = 'Both title and content are required.';
                                            } else if (!title.trim()) {
                                                errorMsg = 'Please add a title to your note.';
                                            } else {
                                                errorMsg = 'Please add some content to your note.';
                                            }
                                            setShowConfirmModal(false);
                                            handleError(errorMsg);
                                        }
                                    }}
                                >
                                    <Text 
                                        style={[
                                            styles.saveText, 
                                        ]}
                                    >
                                        Save
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {renderErrorModal()}
                {renderSuccessModal()}
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 1000,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 23,
        paddingVertical: 15,
        backgroundColor: '#fff',
        marginTop: 15,
    },
    iconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    icon: {
        width: 20,
        height: 20,
    },
    iconSave: {
        width: 22,
        height: 22,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '600',
        color: '#333',
        includeFontPadding: false,
    },
    form: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 20,
        margin: 20,
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        backgroundColor: '#fff',
        position: 'relative',
        overflow: 'hidden',
    },
    titleInput: {
        fontSize: 30,
        fontWeight: '500',
        color: '#333',
        backgroundColor: '#fff',
        zIndex: 1,
        flexWrap: 'wrap',
    },
    dateTimeText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
        marginTop: -5,
        marginLeft: 5,
        backgroundColor: '#fff',
        zIndex: 1,
    },
    contentInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        lineHeight: 28,
        backgroundColor: 'transparent',
        paddingHorizontal: 5,
        zIndex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#eef0f2',
        minHeight: 28,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '85%',
        alignItems: 'center',
        position: 'relative',
    },
    successModalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '70%',
        alignItems: 'center',
        position: 'relative',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#000',
        includeFontPadding: false,
    },
    successModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginTop: 10,
        includeFontPadding: false,
    },
    modalMessage: {
        fontSize: 15,
        color: '#333',
        marginBottom: 30,
        paddingVertical: 7,
        paddingHorizontal: 15,
        textAlign: 'center',
        includeFontPadding: false,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    discardButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    saveButton: {
        backgroundColor: '#000',
    },
    disabledButton: {
        backgroundColor: '#111',
        opacity: 0.5,
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        includeFontPadding: false,
    },
    saveText: {
        color: '#fff',
    },
    modalHeaderAligned: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 25,
        marginTop:3,
    },
    closeModalButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeModalText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 14,
    },
    centeredModalHeader: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 25,
        marginTop: 3,
    },
    errorModalButtonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    smallOkButton: {
        width: '20%',
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#000',
    },
    successIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successIcon: {
        width: 25,
        height: 25,
        tintColor: '#fff',
    }
});

export default AddNoteScreen;