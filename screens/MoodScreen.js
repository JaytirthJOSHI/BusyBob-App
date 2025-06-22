import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, feelingsAPI } from '../lib/supabase';

export default function MoodScreen() {
  const [feelings, setFeelings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFeelings();
  }, []);

  const loadFeelings = async () => {
    try {
      const { data: userData } = await auth.getCurrentUser();
      setUser(userData.user);
      
      if (userData.user) {
        const { data, error } = await feelingsAPI.getFeelings(userData.user.id);
        if (error) {
          Alert.alert('Error', 'Failed to load mood entries');
        } else {
          setFeelings(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading feelings:', error);
      Alert.alert('Error', 'Failed to load mood entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMood = async () => {
    if (selectedRating === 0) {
      Alert.alert('Error', 'Please select a mood rating');
      return;
    }

    setSubmitting(true);

    try {
      const moodData = {
        user_id: user.id,
        rating: selectedRating,
        comments: comments.trim() || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await feelingsAPI.createFeeling(moodData);
      
      if (error) {
        Alert.alert('Error', 'Failed to save mood entry');
      } else {
        setFeelings([data[0], ...feelings]);
        setSelectedRating(0);
        setComments('');
        Alert.alert('Success', 'Mood logged successfully!');
      }
    } catch (error) {
      console.error('Error creating mood entry:', error);
      Alert.alert('Error', 'Failed to save mood entry');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMoodEntry = async (feelingId) => {
    Alert.alert(
      'Delete Mood Entry',
      'Are you sure you want to delete this mood entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await feelingsAPI.deleteFeeling(feelingId);
              if (error) {
                Alert.alert('Error', 'Failed to delete mood entry');
              } else {
                setFeelings(feelings.filter(feeling => feeling.id !== feelingId));
              }
            } catch (error) {
              console.error('Error deleting mood entry:', error);
              Alert.alert('Error', 'Failed to delete mood entry');
            }
          },
        },
      ]
    );
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

  const getMoodLabel = (rating) => {
    const moodLabels = {
      1: 'Very Sad',
      2: 'Sad',
      3: 'Neutral',
      4: 'Happy',
      5: 'Very Happy'
    };
    return moodLabels[rating] || 'Unknown';
  };

  const getMoodColor = (rating) => {
    const colors = {
      1: '#ef4444',
      2: '#f97316',
      3: '#eab308',
      4: '#22c55e',
      5: '#10b981'
    };
    return colors[rating] || '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading mood entries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Mood Logger */}
        <View style={styles.loggerSection}>
          <Text style={styles.sectionTitle}>How are you feeling today?</Text>
          
          <View style={styles.moodSelector}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.moodButton,
                  selectedRating === rating && styles.selectedMoodButton,
                  { borderColor: getMoodColor(rating) }
                ]}
                onPress={() => setSelectedRating(rating)}
              >
                <Text style={styles.moodEmoji}>{getMoodEmoji(rating)}</Text>
                <Text style={[styles.moodLabel, { color: getMoodColor(rating) }]}>
                  {getMoodLabel(rating)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.commentsSection}>
            <Text style={styles.inputLabel}>Comments (optional)</Text>
            <TextInput
              style={styles.commentsInput}
              value={comments}
              onChangeText={setComments}
              placeholder="How are you feeling? What's on your mind?"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmitMood}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Saving...' : 'Log Mood'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mood History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Mood History</Text>
          
          {feelings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={64} color="#94a3b8" />
              <Text style={styles.emptyStateText}>No mood entries yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tracking your mood to see patterns over time
              </Text>
            </View>
          ) : (
            <View style={styles.moodList}>
              {feelings.map((feeling) => (
                <View key={feeling.id} style={styles.moodCard}>
                  <View style={styles.moodCardHeader}>
                    <View style={styles.moodInfo}>
                      <Text style={styles.moodCardEmoji}>
                        {getMoodEmoji(feeling.rating)}
                      </Text>
                      <View style={styles.moodDetails}>
                        <Text style={styles.moodRating}>
                          {getMoodLabel(feeling.rating)} ({feeling.rating}/5)
                        </Text>
                        <Text style={styles.moodDate}>
                          {new Date(feeling.created_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteMoodEntry(feeling.id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  
                  {feeling.comments && (
                    <Text style={styles.moodComments}>{feeling.comments}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggerSection: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historySection: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flex: 1,
    marginHorizontal: 2,
  },
  selectedMoodButton: {
    backgroundColor: '#ffffff',
    transform: [{ scale: 1.05 }],
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  commentsSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  moodList: {
    marginTop: 8,
  },
  moodCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodCardEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  moodDetails: {
    flex: 1,
  },
  moodRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  moodDate: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteButton: {
    padding: 4,
  },
  moodComments: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 20,
  },
}); 