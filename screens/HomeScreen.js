import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, tasksAPI, feelingsAPI } from '../lib/supabase';
import { useTheme, getPriorityColor } from '../lib/theme';
import offlineStorage from '../lib/offlineStorage';
import { 
  AnimatedGlassBackground, 
  GlassyCard, 
  GlassyButton 
} from '../components/GlassyComponents'; 

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const [user, setUser] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [recentMood, setRecentMood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Check if in guest mode or authenticated
      const isGuest = await offlineStorage.isGuestMode();
      let userId = 'guest_user';
      
      if (isGuest) {
        const guestProfile = await offlineStorage.getGuestProfile();
        setUser(guestProfile);
      } else {
        // Get current user for authenticated users
        const { data: userData } = await auth.getCurrentUser();
        setUser(userData.user);
        userId = userData.user?.id || 'guest_user';
      }

      // Get today's tasks (works both online and offline)
      const tasks = await offlineStorage.getTasks(userId);
      const today = new Date().toDateString();
      const todaysTasks = tasks?.filter(task => 
        new Date(task.due_date).toDateString() === today
      ) || [];
      setTodayTasks(todaysTasks);

      // Get recent mood (works both online and offline)
      const feelings = await offlineStorage.getFeelings(userId);
      if (feelings && feelings.length > 0) {
        setRecentMood(feelings[0]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  // Use the theme-aware priority color function
  const getTaskPriorityColor = (priority) => {
    return getPriorityColor(priority, { colors });
  };

  const quickLogMood = () => {
    navigation.navigate('Mood');
  };

  const addQuickTask = () => {
    navigation.navigate('Tasks');
  };

  // Create dynamic styles based on theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    header: {
      marginBottom: 30,
    },
    greeting: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    date: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 25,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    seeAllText: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '500',
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    actionCard: {
      padding: 16,
      alignItems: 'center',
      width: '48%',
      marginBottom: 10,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginTop: 8,
    },
    taskItem: {
      padding: 16,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    taskContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    priorityIndicator: {
      width: 4,
      height: 40,
      borderRadius: 2,
      marginRight: 12,
    },
    taskDetails: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    completedTask: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    taskTime: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      padding: 30,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '500',
      color: colors.text,
      marginTop: 10,
      marginBottom: 5,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyStateButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    emptyStateButtonText: {
      color: colors.textInverted,
      fontSize: 14,
      fontWeight: '500',
    },
    moodCard: {
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    moodEmoji: {
      fontSize: 32,
      marginRight: 15,
    },
    moodDetails: {
      flex: 1,
    },
    moodRating: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
    },
    moodDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    moodComment: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <AnimatedGlassBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.text }}>Loading...</Text>
          </View>
        </SafeAreaView>
      </AnimatedGlassBackground>
    );
  }

  return (
    <AnimatedGlassBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student'}! 👋
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Quick Actions */}
        <GlassyCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <GlassyCard style={styles.actionCard}>
              <TouchableOpacity onPress={addQuickTask} style={{ alignItems: 'center' }}>
                <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>
            </GlassyCard>
            
            <GlassyCard style={styles.actionCard}>
              <TouchableOpacity onPress={quickLogMood} style={{ alignItems: 'center' }}>
                <Ionicons name="happy-outline" size={32} color={colors.success} />
                <Text style={styles.actionText}>Log Mood</Text>
              </TouchableOpacity>
            </GlassyCard>
            
            <GlassyCard style={styles.actionCard}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Journal')}
                style={{ alignItems: 'center' }}
              >
                <Ionicons name="book-outline" size={32} color={colors.secondary} />
                <Text style={styles.actionText}>Write</Text>
              </TouchableOpacity>
            </GlassyCard>
            
            <GlassyCard style={styles.actionCard}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Calendar')}
                style={{ alignItems: 'center' }}
              >
                <Ionicons name="calendar-outline" size={32} color={colors.warning} />
                <Text style={styles.actionText}>Calendar</Text>
              </TouchableOpacity>
            </GlassyCard>
          </View>
        </GlassyCard>

        {/* Today's Tasks */}
        <GlassyCard style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text style={styles.emptyStateText}>No tasks for today!</Text>
              <Text style={styles.emptyStateSubtext}>Enjoy your free time or add a new task</Text>
            </View>
          ) : (
            <View>
              {todayTasks.slice(0, 3).map((task) => (
                <GlassyCard key={task.id} style={styles.taskItem}>
                  <View style={styles.taskContent}>
                    <View style={[styles.priorityIndicator, { backgroundColor: getTaskPriorityColor(task.priority) }]} />
                    <View style={styles.taskDetails}>
                      <Text style={[styles.taskTitle, task.completed && styles.completedTask]}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskTime}>
                        {task.due_time ? new Date(`2000-01-01T${task.due_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'No time set'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name={task.completed ? "checkmark-circle" : "ellipse-outline"} 
                    size={24} 
                    color={task.completed ? colors.success : colors.border} 
                  />
                </GlassyCard>
              ))}
            </View>
          )}
        </GlassyCard>

        {/* Recent Mood */}
        <GlassyCard style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Mood</Text>
          {recentMood ? (
            <View style={styles.moodCard}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(recentMood.rating)}</Text>
              <View style={styles.moodDetails}>
                <Text style={styles.moodRating}>Feeling {recentMood.rating}/5</Text>
                <Text style={styles.moodDate}>
                  {new Date(recentMood.created_at).toLocaleDateString()}
                </Text>
                {recentMood.comments && (
                  <Text style={styles.moodComment}>{recentMood.comments}</Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyStateText}>No mood logged yet</Text>
              <GlassyButton 
                onPress={quickLogMood}
                variant="primary"
                size="small"
              >
                Log Your Mood
              </GlassyButton>
            </View>
          )}
        </GlassyCard>
      </ScrollView>
    </SafeAreaView>
    </AnimatedGlassBackground>
  );
}

