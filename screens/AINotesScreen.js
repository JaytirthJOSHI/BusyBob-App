import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../lib/theme';
import { auth, aiNotesAPI } from '../lib/supabase';
import offlineStorage from '../lib/offlineStorage';
import { 
  AnimatedGlassBackground, 
  GlassyCard, 
  GlassyButton 
} from '../components/GlassyComponents';

export default function AINotesScreen() {
  const { colors } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [processingAI, setProcessingAI] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const isGuest = await offlineStorage.isGuestMode();
      let userId = 'guest_user';
      
      if (!isGuest) {
        const { data: userData } = await auth.getCurrentUser();
        setUser(userData.user);
        userId = userData.user?.id || 'guest_user';
      } else {
        const guestProfile = await offlineStorage.getGuestProfile();
        setUser(guestProfile);
      }

      // Load stored notes
      const storedNotes = await offlineStorage.getNotes(userId);
      console.log('Loaded notes:', storedNotes.length);
      setNotes(storedNotes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      setShowRecordModal(true);

      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      recording.timer = timer;
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', `Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        setIsRecording(false);
        clearInterval(recording.timer);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        
        await processAudioRecording(uri);
        
        setRecording(null);
        setShowRecordModal(false);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const processAudioRecording = async (audioUri) => {
    setProcessingAI(true);
    try {
      console.log('Processing audio recording:', audioUri);
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const noteData = {
        title: `Audio Note - ${new Date().toLocaleDateString()}`,
        content: "This is a simulated transcription of your audio recording. In a real implementation, this would use speech-to-text AI services like OpenAI Whisper, Google Speech-to-Text, or similar services to convert your spoken words into text.",
        transcript: "This is a simulated transcription of your audio recording. In a real implementation, this would use speech-to-text AI services like OpenAI Whisper, Google Speech-to-Text, or similar services to convert your spoken words into text.",
        note_type: 'recording',
        ai_summary: "AI-generated summary: This audio note contains important information that has been transcribed and summarized. The AI has identified key points and themes from your recording.",
        audio_duration: recordingDuration,
        processing_status: 'completed',
        metadata: { audio_uri: audioUri },
        user_id: user?.id || 'guest_user',
      };

      // Save the note
      await offlineStorage.saveNote(noteData, user?.id || 'guest_user');
      setNotes(prev => [noteData, ...prev]);
      
      console.log('Audio recording processed and saved successfully');
      Alert.alert('Success', 'Audio note processed successfully!');
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert('Error', `Failed to process audio recording: ${error.message}`);
    } finally {
      setProcessingAI(false);
    }
  };

  const pickDocument = async () => {
    try {
      console.log('Opening document picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types initially
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        console.log('Selected file:', file);
        
        // Check if it's a supported file type
        const supportedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!supportedTypes.includes(file.mimeType)) {
          Alert.alert('Unsupported File', 'Please select a PDF, TXT, or DOC file.');
          return;
        }
        
        await processDocument(file);
      } else {
        console.log('Document selection cancelled or no file selected');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', `Failed to pick document: ${error.message}`);
    }
  };

  const processDocument = async (file) => {
    setProcessingAI(true);
    try {
      console.log('Processing document:', file.name);
      
      // Try to read file content for text files
      let content = "Document content processed";
      if (file.mimeType === 'text/plain') {
        try {
          content = await FileSystem.readAsStringAsync(file.uri);
          console.log('File content read successfully');
        } catch (readError) {
          console.log('Could not read file content:', readError);
        }
      }

      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const noteData = {
        title: file.name || `Document - ${new Date().toLocaleDateString()}`,
        content: content,
        note_type: 'upload',
        ai_summary: "AI-generated summary of the document content. This is a simulated summary that would normally be generated by an AI service like GPT-4 or Claude.",
        source_file_name: file.name,
        source_file_type: file.mimeType,
        source_file_size: file.size,
        processing_status: 'completed',
        user_id: user?.id || 'guest_user',
      };

      // Save the note
      await offlineStorage.saveNote(noteData, user?.id || 'guest_user');
      setNotes(prev => [noteData, ...prev]);
      
      console.log('Document processed and saved successfully');
      Alert.alert('Success', 'Document processed successfully!');
    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert('Error', `Failed to process document: ${error.message}`);
    } finally {
      setProcessingAI(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteNote = async (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this AI note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorage.deleteNote(noteId, user?.id || 'guest_user');
              setNotes(prev => prev.filter(note => note.id !== noteId));
              Alert.alert('Success', 'Note deleted successfully');
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    touchableActionCard: {
      flex: 1,
      marginHorizontal: 5,
    },
    actionCard: {
      padding: 20,
      alignItems: 'center',
    },
    actionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginTop: 8,
    },
    actionSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    noteCard: {
      padding: 16,
      marginBottom: 12,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginLeft: 8,
    },
    deleteButton: {
      padding: 4,
    },
    noteDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    noteContent: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    aiSummary: {
      backgroundColor: colors.primary + '10',
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      marginTop: 8,
    },
    aiSummaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 4,
    },
    aiSummaryText: {
      fontSize: 13,
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      padding: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalButton: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    recordingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    recordingIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    recordingTime: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    recordingStatus: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 40,
    },
    processingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    processingText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 20,
      textAlign: 'center',
    },
    fileInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.glass.border,
    },
    fileName: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });

  if (loading) {
    return (
      <AnimatedGlassBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.processingText}>Loading your notes...</Text>
          </View>
        </SafeAreaView>
      </AnimatedGlassBackground>
    );
  }

  return (
    <AnimatedGlassBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 AI Notes</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.quickActions}>
            <TouchableOpacity onPress={pickDocument} style={styles.touchableActionCard}>
              <GlassyCard style={styles.actionCard}>
                <Ionicons name="document-text" size={32} color={colors.primary} />
                <Text style={styles.actionText}>Upload Document</Text>
                <Text style={styles.actionSubtext}>PDF, TXT, DOC</Text>
              </GlassyCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={startRecording} style={styles.touchableActionCard}>
              <GlassyCard style={styles.actionCard}>
                <Ionicons name="mic" size={32} color={colors.primary} />
                <Text style={styles.actionText}>Record Audio</Text>
                <Text style={styles.actionSubtext}>Voice to Notes</Text>
              </GlassyCard>
            </TouchableOpacity>
          </View>

          {notes.length === 0 ? (
            <GlassyCard style={styles.emptyState}>
              <Ionicons name="bulb-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>No AI Notes Yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Upload documents or record audio to generate AI-powered notes with summaries and insights.
              </Text>
            </GlassyCard>
          ) : (
            notes.map(note => (
              <GlassyCard key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Ionicons 
                    name={note.note_type === 'recording' ? 'mic' : 'document-text'} 
                    size={20} 
                    color={colors.primary}
                  />
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  <TouchableOpacity
                    onPress={() => deleteNote(note.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.noteDate}>
                  {new Date(note.created_at).toLocaleDateString()}
                  {note.audio_duration && ` • ${formatDuration(note.audio_duration)}`}
                </Text>

                <Text style={styles.noteContent} numberOfLines={3}>
                  {note.content}
                </Text>

                {note.ai_summary && (
                  <View style={styles.aiSummary}>
                    <Text style={styles.aiSummaryLabel}>AI SUMMARY</Text>
                    <Text style={styles.aiSummaryText} numberOfLines={3}>
                      {note.ai_summary}
                    </Text>
                  </View>
                )}

                {note.source_file_name && (
                  <View style={styles.fileInfo}>
                    <Ionicons name="attach" size={16} color={colors.textSecondary} />
                    <Text style={styles.fileName}>{note.source_file_name}</Text>
                  </View>
                )}
              </GlassyCard>
            ))
          )}
        </ScrollView>

        <Modal
          visible={showRecordModal}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  setShowRecordModal(false);
                }
              }}>
                <Text style={styles.modalButton}>
                  {isRecording ? 'Stop' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Recording Audio</Text>
              <View style={{ width: 60 }} />
            </View>

            {processingAI ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.processingText}>Processing with AI...</Text>
              </View>
            ) : (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingIcon}>
                  <Ionicons 
                    name="mic" 
                    size={60} 
                    color={isRecording ? colors.error : colors.textSecondary} 
                  />
                </View>
                <Text style={styles.recordingTime}>
                  {formatDuration(recordingDuration)}
                </Text>
                <Text style={styles.recordingStatus}>
                  {isRecording ? 'Recording in progress...' : 'Ready to record'}
                </Text>
                <GlassyButton
                  onPress={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "error" : "primary"}
                  size="large"
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </GlassyButton>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AnimatedGlassBackground>
  );
}