import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { auth, tasksAPI } from '../lib/supabase';

export default function CalendarScreen() {
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      generateMarkedDates();
      filterTasksForSelectedDate();
    }
  }, [tasks, selectedDate]);

  const loadTasks = async () => {
    try {
      const { data: userData } = await auth.getCurrentUser();
      setUser(userData.user);
      
      if (userData.user) {
        const { data, error } = await tasksAPI.getTasks(userData.user.id);
        if (error) {
          Alert.alert('Error', 'Failed to load tasks');
        } else {
          setTasks(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const generateMarkedDates = () => {
    const marked = {};
    
    // Mark today
    const today = new Date().toISOString().split('T')[0];
    marked[today] = {
      marked: true,
      dotColor: '#3B82F6',
    };

    // Mark dates with tasks
    tasks.forEach(task => {
      const taskDate = task.due_date;
      if (marked[taskDate]) {
        marked[taskDate] = {
          ...marked[taskDate],
          marked: true,
          dotColor: task.completed ? '#10b981' : '#f59e0b',
        };
      } else {
        marked[taskDate] = {
          marked: true,
          dotColor: task.completed ? '#10b981' : '#f59e0b',
        };
      }
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#3B82F6',
    };

    setMarkedDates(marked);
  };

  const filterTasksForSelectedDate = () => {
    const filtered = tasks.filter(task => task.due_date === selectedDate);
    setSelectedTasks(filtered);
  };

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'No time set';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#64748b',
              textSectionTitleDisabledColor: '#d1d5db',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3B82F6',
              dayTextColor: '#1e293b',
              textDisabledColor: '#d1d5db',
              dotColor: '#3B82F6',
              selectedDotColor: '#ffffff',
              arrowColor: '#3B82F6',
              disabledArrowColor: '#d1d5db',
              monthTextColor: '#1e293b',
              indicatorColor: '#3B82F6',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14
            }}
          />
        </View>

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>
            Tasks for {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>

          {selectedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks for this date</Text>
              <Text style={styles.emptyStateSubtext}>
                Your schedule is clear for this day!
              </Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {selectedTasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(task.priority) }]} />
                    
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, task.completed && styles.completedTask]}>
                        {task.title}
                      </Text>
                      
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                      
                      <View style={styles.taskMeta}>
                        <Text style={styles.taskTime}>
                          {formatTime(task.due_time)}
                        </Text>
                        
                        <View style={styles.taskTags}>
                          <View style={[styles.priorityTag, { backgroundColor: getPriorityColor(task.priority) }]}>
                            <Text style={styles.tagText}>{task.priority}</Text>
                          </View>
                          
                          <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{task.category}</Text>
                          </View>
                          
                          {task.stress_level && (
                            <View style={styles.stressTag}>
                              <Text style={styles.stressText}>Stress: {task.stress_level}/5</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.taskStatus}>
                      {task.completed ? (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedText}>✓</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>○</Text>
                        </View>
                      )}
                    </View>
                  </View>
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
  calendarContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
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
  tasksSection: {
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  tasksList: {
    marginTop: 8,
  },
  taskCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityIndicator: {
    width: 4,
    height: 60,
    borderRadius: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  taskMeta: {
    marginTop: 8,
  },
  taskTime: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  taskTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  categoryTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  stressTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  stressText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
  },
  taskStatus: {
    marginLeft: 12,
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingText: {
    color: '#64748b',
    fontSize: 12,
  },
}); 