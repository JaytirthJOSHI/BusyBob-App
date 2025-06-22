import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase, tasksAPI, feelingsAPI, journalAPI, aiNotesAPI } from './supabase';

const STORAGE_KEYS = {
  TASKS: 'offline_tasks',
  FEELINGS: 'offline_feelings',
  JOURNAL: 'offline_journal',
  AI_NOTES: 'offline_ai_notes',
  SYNC_QUEUE: 'sync_queue',
  USER_PROFILE: 'user_profile',
  GUEST_MODE: 'guest_mode',
};

class OfflineStorage {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.initNetworkListener();
  }

  initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      // If we just came back online, try to sync
      if (wasOffline && this.isOnline) {
        this.syncWithServer();
      }
    });
  }

  async isNetworkAvailable() {
    const state = await NetInfo.fetch();
    return state.isConnected;
  }

  // Guest mode for offline users
  async enableGuestMode() {
    await AsyncStorage.setItem(STORAGE_KEYS.GUEST_MODE, 'true');
    const guestProfile = {
      id: 'guest_user',
      email: 'guest@busybob.local',
      name: 'Guest User',
      created_at: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(guestProfile));
    return guestProfile;
  }

  async isGuestMode() {
    const guestMode = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_MODE);
    return guestMode === 'true';
  }

  async getGuestProfile() {
    const profileData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return profileData ? JSON.parse(profileData) : null;
  }

  // Task Management
  async getTasks(userId = 'guest_user') {
    try {
      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await tasksAPI.getTasks(userId);
        // Cache tasks locally
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data || []));
        return data || [];
      } else {
        // Return cached tasks
        const cachedTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
        return cachedTasks ? JSON.parse(cachedTasks) : [];
      }
    } catch (error) {
      console.log('Using cached tasks due to error:', error);
      const cachedTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return cachedTasks ? JSON.parse(cachedTasks) : [];
    }
  }

  async addTask(task, userId = 'guest_user') {
    const newTask = {
      id: `temp_${Date.now()}`,
      ...task,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Add to local storage immediately
      const existingTasks = await this.getTasks(userId);
      const updatedTasks = [...existingTasks, newTask];
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

      if (this.isOnline && !await this.isGuestMode()) {
        // Try to sync with server
        const { data } = await tasksAPI.createTask(task, userId);
        if (data) {
          // Replace temp task with server task
          const finalTasks = updatedTasks.map(t => t.id === newTask.id ? data : t);
          await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(finalTasks));
          return data;
        }
      } else {
        // Add to sync queue
        await this.addToSyncQueue('task', 'create', newTask);
      }

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      // Still add to sync queue for later
      await this.addToSyncQueue('task', 'create', newTask);
      return newTask;
    }
  }

  async updateTask(taskId, updates, userId = 'guest_user') {
    try {
      // Update local storage immediately
      const existingTasks = await this.getTasks(userId);
      const updatedTasks = existingTasks.map(task => 
        task.id === taskId ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      );
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

      if (this.isOnline && !await this.isGuestMode()) {
        // Try to sync with server
        await tasksAPI.updateTask(taskId, updates, userId);
      } else {
        // Add to sync queue
        await this.addToSyncQueue('task', 'update', { id: taskId, ...updates });
      }

      return updatedTasks.find(task => task.id === taskId);
    } catch (error) {
      console.error('Error updating task:', error);
      await this.addToSyncQueue('task', 'update', { id: taskId, ...updates });
      const existingTasks = await this.getTasks(userId);
      return existingTasks.find(task => task.id === taskId);
    }
  }

  async deleteTask(taskId, userId = 'guest_user') {
    try {
      // Remove from local storage immediately
      const existingTasks = await this.getTasks(userId);
      const updatedTasks = existingTasks.filter(task => task.id !== taskId);
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

      if (this.isOnline && !await this.isGuestMode()) {
        // Try to sync with server
        await tasksAPI.deleteTask(taskId, userId);
      } else {
        // Add to sync queue
        await this.addToSyncQueue('task', 'delete', { id: taskId });
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      await this.addToSyncQueue('task', 'delete', { id: taskId });
      return true;
    }
  }

  // Feelings Management
  async getFeelings(userId = 'guest_user') {
    try {
      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await feelingsAPI.getFeelings(userId);
        await AsyncStorage.setItem(STORAGE_KEYS.FEELINGS, JSON.stringify(data || []));
        return data || [];
      } else {
        const cachedFeelings = await AsyncStorage.getItem(STORAGE_KEYS.FEELINGS);
        return cachedFeelings ? JSON.parse(cachedFeelings) : [];
      }
    } catch (error) {
      console.log('Using cached feelings due to error:', error);
      const cachedFeelings = await AsyncStorage.getItem(STORAGE_KEYS.FEELINGS);
      return cachedFeelings ? JSON.parse(cachedFeelings) : [];
    }
  }

  async addFeeling(feeling, userId = 'guest_user') {
    const newFeeling = {
      id: `temp_${Date.now()}`,
      ...feeling,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    try {
      const existingFeelings = await this.getFeelings(userId);
      const updatedFeelings = [newFeeling, ...existingFeelings];
      await AsyncStorage.setItem(STORAGE_KEYS.FEELINGS, JSON.stringify(updatedFeelings));

      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await feelingsAPI.createFeeling(feeling, userId);
        if (data) {
          const finalFeelings = updatedFeelings.map(f => f.id === newFeeling.id ? data : f);
          await AsyncStorage.setItem(STORAGE_KEYS.FEELINGS, JSON.stringify(finalFeelings));
          return data;
        }
      } else {
        await this.addToSyncQueue('feeling', 'create', newFeeling);
      }

      return newFeeling;
    } catch (error) {
      console.error('Error adding feeling:', error);
      await this.addToSyncQueue('feeling', 'create', newFeeling);
      return newFeeling;
    }
  }

  // Journal Management
  async getJournalEntries(userId = 'guest_user') {
    try {
      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await journalAPI.getEntries(userId);
        await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(data || []));
        return data || [];
      } else {
        const cachedEntries = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL);
        return cachedEntries ? JSON.parse(cachedEntries) : [];
      }
    } catch (error) {
      console.log('Using cached journal entries due to error:', error);
      const cachedEntries = await AsyncStorage.getItem(STORAGE_KEYS.JOURNAL);
      return cachedEntries ? JSON.parse(cachedEntries) : [];
    }
  }

  async addJournalEntry(entry, userId = 'guest_user') {
    const newEntry = {
      id: `temp_${Date.now()}`,
      ...entry,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const existingEntries = await this.getJournalEntries(userId);
      const updatedEntries = [newEntry, ...existingEntries];
      await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(updatedEntries));

      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await journalAPI.createEntry(entry, userId);
        if (data) {
          const finalEntries = updatedEntries.map(e => e.id === newEntry.id ? data : e);
          await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(finalEntries));
          return data;
        }
      } else {
        await this.addToSyncQueue('journal', 'create', newEntry);
      }

      return newEntry;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      await this.addToSyncQueue('journal', 'create', newEntry);
      return newEntry;
    }
  }

  // AI Notes Management
  async getNotes(userId = 'guest_user') {
    try {
      if (this.isOnline && !await this.isGuestMode()) {
        const { data } = await aiNotesAPI.getAINotes(userId);
        await AsyncStorage.setItem(STORAGE_KEYS.AI_NOTES, JSON.stringify(data || []));
        return data || [];
      } else {
        const cachedNotes = await AsyncStorage.getItem(STORAGE_KEYS.AI_NOTES);
        return cachedNotes ? JSON.parse(cachedNotes) : [];
      }
    } catch (error) {
      console.log('Using cached AI notes due to error:', error);
      const cachedNotes = await AsyncStorage.getItem(STORAGE_KEYS.AI_NOTES);
      return cachedNotes ? JSON.parse(cachedNotes) : [];
    }
  }

  async saveNote(note, userId = 'guest_user') {
    const newNote = {
      id: `temp_${Date.now()}`,
      ...note,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // Add to local storage immediately
      const existingNotes = await this.getNotes(userId);
      const updatedNotes = [newNote, ...existingNotes];
      await AsyncStorage.setItem(STORAGE_KEYS.AI_NOTES, JSON.stringify(updatedNotes));

      if (this.isOnline && !await this.isGuestMode()) {
        // Try to sync with server
        const { data } = await aiNotesAPI.createAINote(note);
        if (data) {
          // Replace temp note with server note
          const finalNotes = updatedNotes.map(n => n.id === newNote.id ? data[0] : n);
          await AsyncStorage.setItem(STORAGE_KEYS.AI_NOTES, JSON.stringify(finalNotes));
          return data[0];
        }
      } else {
        // Add to sync queue
        await this.addToSyncQueue('ai_note', 'create', newNote);
      }

      return newNote;
    } catch (error) {
      console.error('Error saving AI note:', error);
      // Still add to sync queue for later
      await this.addToSyncQueue('ai_note', 'create', newNote);
      return newNote;
    }
  }

  async deleteNote(noteId, userId = 'guest_user') {
    try {
      // Remove from local storage immediately
      const existingNotes = await this.getNotes(userId);
      const updatedNotes = existingNotes.filter(note => note.id !== noteId);
      await AsyncStorage.setItem(STORAGE_KEYS.AI_NOTES, JSON.stringify(updatedNotes));

      if (this.isOnline && !await this.isGuestMode()) {
        // Try to sync with server
        await aiNotesAPI.deleteAINote(noteId);
      } else {
        // Add to sync queue
        await this.addToSyncQueue('ai_note', 'delete', { id: noteId });
      }

      return true;
    } catch (error) {
      console.error('Error deleting AI note:', error);
      await this.addToSyncQueue('ai_note', 'delete', { id: noteId });
      return true;
    }
  }

  // Sync Queue Management
  async addToSyncQueue(type, action, item) {
    try {
      const existingQueue = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      queue.push({
        id: `sync_${Date.now()}`,
        type,
        action,
        item,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async syncWithServer() {
    if (this.syncInProgress || !this.isOnline || await this.isGuestMode()) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync with server...');

    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue = queueData ? JSON.parse(queueData) : [];

      if (queue.length === 0) {
        this.syncInProgress = false;
        return;
      }

      const processedIds = [];

      for (const queueItem of queue) {
        try {
          await this.processSyncItem(queueItem);
          processedIds.push(queueItem.id);
        } catch (error) {
          console.error('Error processing sync item:', error);
          // Continue with other items
        }
      }

      // Remove processed items from queue
      const remainingQueue = queue.filter(item => !processedIds.includes(item.id));
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingQueue));

      console.log(`Sync completed. Processed ${processedIds.length} items.`);
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processSyncItem(queueItem) {
    const { type, action, item } = queueItem;

    // Get current user ID (should be available if we're syncing)
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      throw new Error('No user ID available for sync');
    }

    switch (type) {
      case 'task':
        if (action === 'create') {
          await tasksAPI.createTask(item, userId);
        } else if (action === 'update') {
          await tasksAPI.updateTask(item.id, item, userId);
        } else if (action === 'delete') {
          await tasksAPI.deleteTask(item.id, userId);
        }
        break;

      case 'feeling':
        if (action === 'create') {
          await feelingsAPI.createFeeling(item, userId);
        }
        break;

      case 'journal':
        if (action === 'create') {
          await journalAPI.createEntry(item, userId);
        } else if (action === 'update') {
          await journalAPI.updateEntry(item.id, item, userId);
        }
        break;

      case 'ai_note':
        if (action === 'create') {
          await aiNotesAPI.createAINote(item);
        } else if (action === 'update') {
          await aiNotesAPI.updateAINote(item.id, item);
        } else if (action === 'delete') {
          await aiNotesAPI.deleteAINote(item.id);
        }
        break;

      default:
        console.warn('Unknown sync item type:', type);
    }
  }

  // Migration from guest to authenticated user
  async migrateGuestData(newUserId) {
    if (!await this.isGuestMode()) {
      return;
    }

    try {
      console.log('Migrating guest data to authenticated user...');

      // Migrate tasks
      const tasks = await this.getTasks('guest_user');
      for (const task of tasks) {
        if (task.id.startsWith('temp_')) {
          await tasksAPI.createTask(task, newUserId);
        }
      }

      // Migrate feelings
      const feelings = await this.getFeelings('guest_user');
      for (const feeling of feelings) {
        if (feeling.id.startsWith('temp_')) {
          await feelingsAPI.createFeeling(feeling, newUserId);
        }
      }

      // Migrate journal entries
      const entries = await this.getJournalEntries('guest_user');
      for (const entry of entries) {
        if (entry.id.startsWith('temp_')) {
          await journalAPI.createEntry(entry, newUserId);
        }
      }

      // Migrate AI notes
      const aiNotes = await this.getNotes('guest_user');
      for (const note of aiNotes) {
        if (note.id.startsWith('temp_')) {
          await aiNotesAPI.createAINote({ ...note, user_id: newUserId });
        }
      }

      // Clear guest mode
      await AsyncStorage.removeItem(STORAGE_KEYS.GUEST_MODE);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);

      console.log('Guest data migration completed');
    } catch (error) {
      console.error('Error migrating guest data:', error);
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  }
}

export const offlineStorage = new OfflineStorage();
export default offlineStorage; 