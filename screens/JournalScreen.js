import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, journalAPI } from '../lib/supabase';

export default function JournalScreen() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [user, setUser] = useState(null);
  
  // Form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood_rating: 3,
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data: userData } = await auth.getCurrentUser();
      setUser(userData.user);
      
      if (userData.user) {
        const { data, error } = await journalAPI.getJournalEntries(userData.user.id);
        if (error) {
          Alert.alert('Error', 'Failed to load journal entries');
        } else {
          setEntries(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.content.trim()) {
      Alert.alert('Error', 'Please write something in your journal');
      return;
    }

    try {
      const entryData = {
        ...newEntry,
        user_id: user.id,
        title: newEntry.title.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await journalAPI.createJournalEntry(entryData);
      
      if (error) {
        Alert.alert('Error', 'Failed to create journal entry');
      } else {
        setEntries([data[0], ...entries]);
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Journal entry saved!');
      }
    } catch (error) {
      console.error('Error creating journal entry:', error);
      Alert.alert('Error', 'Failed to create journal entry');
    }
  };

  const deleteEntry = async (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await journalAPI.deleteJournalEntry(entryId);
              if (error) {
                Alert.alert('Error', 'Failed to delete journal entry');
              } else {
                setEntries(entries.filter(entry => entry.id !== entryId));
              }
            } catch (error) {
              console.error('Error deleting journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewEntry({
      title: '',
      content: '',
      mood_rating: 3,
    });
  };

  const getMoodEmoji = (rating) => {
    const moodEmojis = {
      1: '😞',
      2: '😟',
      3: '😐',
      4: '😊',
      5: '😄'
    };
    return moodEmojis[rating] || '😐';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading journal entries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No journal entries yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start writing to capture your thoughts and reflections
            </Text>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryTitle}>
                      {entry.title || 'Untitled Entry'}
                    </Text>
                    <View style={styles.entryMeta}>
                      <Text style={styles.entryDate}>
                        {formatDate(entry.created_at)}
                      </Text>
                      <Text style={styles.entryTime}>
                        {formatTime(entry.created_at)}
                      </Text>
                      {entry.mood_rating && (
                        <View style={styles.moodBadge}>
                          <Text style={styles.moodEmoji}>
                            {getMoodEmoji(entry.mood_rating)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteEntry(entry.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.entryContent} numberOfLines={3}>
                  {entry.content}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>New Entry</Text>
            
            <TouchableOpacity onPress={handleCreateEntry}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title (optional)</Text>
              <TextInput
                style={styles.input}
                value={newEntry.title}
                onChangeText={(text) => setNewEntry({...newEntry, title: text})}
                placeholder="Give your entry a title..."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Content *</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                value={newEntry.content}
                onChangeText={(text) => setNewEntry({...newEntry, content: text})}
                placeholder="What's on your mind? Write about your day, thoughts, or feelings..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>How are you feeling?</Text>
              <View style={styles.moodSelector}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.moodButton,
                      newEntry.mood_rating === rating && styles.selectedMoodButton
                    ]}
                    onPress={() => setNewEntry({...newEntry, mood_rating: rating})}
                  >
                    <Text style={styles.moodButtonEmoji}>{getMoodEmoji(rating)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  entriesList: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  entryDate: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 12,
  },
  entryTime: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 12,
  },
  moodBadge: {
    marginLeft: 8,
  },
  moodEmoji: {
    fontSize: 16,
  },
  entryContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cancelText: {
    color: '#64748b',
    fontSize: 16,
  },
  saveText: {
    color: '#8b5cf6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  contentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  moodButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedMoodButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  moodButtonEmoji: {
    fontSize: 20,
  },
});