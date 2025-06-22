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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { auth, tasksAPI } from '../lib/supabase';

export default function TasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [user, setUser] = useState(null);
  
  // Form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: new Date(),
    due_time: new Date(),
    priority: 'medium',
    category: 'general',
    stress_level: 3,
  });

  useEffect(() => {
    loadTasks();
  }, []);

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

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const today = new Date();
      const taskData = {
        ...newTask,
        user_id: user.id,
        due_date: today.toISOString().split('T')[0],
        due_time: '23:59:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await tasksAPI.createTask(taskData);
      
      if (error) {
        Alert.alert('Error', 'Failed to create task');
      } else {
        setTasks([...tasks, data[0]]);
        setShowAddModal(false);
        resetForm();
        Alert.alert('Success', 'Task created successfully!');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    try {
      const { data, error } = await tasksAPI.updateTask(taskId, {
        completed: !currentStatus,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        Alert.alert('Error', 'Failed to update task');
      } else {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTask = async (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await tasksAPI.deleteTask(taskId);
              if (error) {
                Alert.alert('Error', 'Failed to delete task');
              } else {
                setTasks(tasks.filter(task => task.id !== taskId));
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      due_date: new Date(),
      due_time: new Date(),
      priority: 'medium',
      category: 'general',
      stress_level: 3,
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
          <Text>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyStateText}>No tasks yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first task
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <TouchableOpacity
                    onPress={() => toggleTaskCompletion(task.id, task.completed)}
                  >
                    <Ionicons
                      name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={task.completed ? "#10b981" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, task.completed && styles.completedTask]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}
                    
                    <View style={styles.taskMeta}>
                      <View style={styles.taskMetaItem}>
                        <Ionicons name="calendar-outline" size={16} color="#64748b" />
                        <Text style={styles.taskMetaText}>{formatDate(task.due_date)}</Text>
                      </View>
                      
                      <View style={styles.taskMetaItem}>
                        <Ionicons name="time-outline" size={16} color="#64748b" />
                        <Text style={styles.taskMetaText}>{formatTime(task.due_time)}</Text>
                      </View>
                    </View>
                    
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
                  
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Task Modal */}
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
            
            <Text style={styles.modalTitle}>New Task</Text>
            
            <TouchableOpacity onPress={handleCreateTask}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newTask.title}
                onChangeText={(text) => setNewTask({...newTask, title: text})}
                placeholder="Enter task title"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask({...newTask, description: text})}
                placeholder="Enter task description"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Due Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{newTask.due_date.toLocaleDateString()}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroupHalf}>
                <Text style={styles.label}>Due Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text>{newTask.due_time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Priority</Text>
              <Picker
                selectedValue={newTask.priority}
                onValueChange={(value) => setNewTask({...newTask, priority: value})}
                style={styles.picker}
              >
                <Picker.Item label="Low" value="low" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="High" value="high" />
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <Picker
                selectedValue={newTask.category}
                onValueChange={(value) => setNewTask({...newTask, category: value})}
                style={styles.picker}
              >
                <Picker.Item label="General" value="general" />
                <Picker.Item label="Academic" value="academic" />
                <Picker.Item label="Personal" value="personal" />
                <Picker.Item label="Work" value="work" />
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Stress Level (1-5)</Text>
              <Picker
                selectedValue={newTask.stress_level}
                onValueChange={(value) => setNewTask({...newTask, stress_level: value})}
                style={styles.picker}
              >
                <Picker.Item label="1 - Very Low" value={1} />
                <Picker.Item label="2 - Low" value={2} />
                <Picker.Item label="3 - Medium" value={3} />
                <Picker.Item label="4 - High" value={4} />
                <Picker.Item label="5 - Very High" value={5} />
              </Picker>
            </View>
          </ScrollView>

          {showDatePicker && (
            <DateTimePicker
              value={newTask.due_date}
              mode="date"
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setNewTask({...newTask, due_date: date});
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={newTask.due_time}
              mode="time"
              onChange={(event, time) => {
                setShowTimePicker(false);
                if (time) {
                  setNewTask({...newTask, due_time: time});
                }
              }}
            />
          )}
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
    backgroundColor: '#3B82F6',
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
  },
  tasksList: {
    padding: 16,
  },
  taskCard: {
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
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskContent: {
    flex: 1,
    marginLeft: 12,
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
    flexDirection: 'row',
    marginBottom: 8,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  taskMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
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
    backgroundColor: '#f1f5f9',
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
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formGroupHalf: {
    flex: 0.48,
    marginBottom: 20,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
  },
}); 