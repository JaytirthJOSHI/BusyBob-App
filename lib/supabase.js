import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import 'react-native-url-polyfill/auto'

const supabaseUrl = Constants.expoConfig.extra.supabaseUrl
const supabaseAnonKey = Constants.expoConfig.extra.supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      })
      
      if (data.user && !error) {
        // Create user profile in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              name: name,
              email: email,
              created_at: new Date().toISOString()
            }
          ])
        
        if (profileError) {
          console.warn('Profile creation failed:', profileError)
        }
      }
      
      return { data, error }
    } catch (err) {
      console.error('SignUp error:', err)
      return { data: null, error: err }
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      console.error('SignIn error:', err)
      return { data: null, error: err }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { data: null, error }
    } catch (err) {
      console.error('SignOut error:', err)
      return { data: null, error: err }
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return { data: { user } }
    } catch (err) {
      console.error('GetCurrentUser error:', err)
      return { data: { user: null } }
    }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Tasks API
export const tasksAPI = {
  getTasks: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true })
      
      return { data, error }
    } catch (err) {
      console.error('Get tasks error:', err)
      return { data: null, error: err }
    }
  },

  createTask: async (task) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Create task error:', err)
      return { data: null, error: err }
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Update task error:', err)
      return { data: null, error: err }
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
      
      return { data, error }
    } catch (err) {
      console.error('Delete task error:', err)
      return { data: null, error: err }
    }
  }
}

// Feelings/Mood API
export const feelingsAPI = {
  getFeelings: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('feelings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (err) {
      console.error('Get feelings error:', err)
      return { data: null, error: err }
    }
  },

  createFeeling: async (feeling) => {
    try {
      const { data, error } = await supabase
        .from('feelings')
        .insert([feeling])
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Create feeling error:', err)
      return { data: null, error: err }
    }
  },

  deleteFeeling: async (feelingId) => {
    try {
      const { data, error } = await supabase
        .from('feelings')
        .delete()
        .eq('id', feelingId)
      
      return { data, error }
    } catch (err) {
      console.error('Delete feeling error:', err)
      return { data: null, error: err }
    }
  }
}

// Journal API
export const journalAPI = {
  getJournalEntries: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (err) {
      console.error('Get journal entries error:', err)
      return { data: null, error: err }
    }
  },

  createJournalEntry: async (entry) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert([entry])
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Create journal entry error:', err)
      return { data: null, error: err }
    }
  },

  updateJournalEntry: async (entryId, updates) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .update(updates)
        .eq('id', entryId)
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Update journal entry error:', err)
      return { data: null, error: err }
    }
  },

  deleteJournalEntry: async (entryId) => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
      
      return { data, error }
    } catch (err) {
      console.error('Delete journal entry error:', err)
      return { data: null, error: err }
    }
  }
}

// AI Notes API
export const aiNotesAPI = {
  getAINotes: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .select(`
          *,
          ai_note_files (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (err) {
      console.error('Get AI notes error:', err)
      return { data: null, error: err }
    }
  },

  createAINote: async (note) => {
    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .insert([{
          user_id: note.user_id,
          title: note.title,
          content: note.content,
          ai_summary: note.ai_summary,
          transcript: note.transcript,
          note_type: note.note_type,
          source_file_name: note.source_file_name,
          source_file_type: note.source_file_type,
          source_file_size: note.source_file_size,
          audio_duration: note.audio_duration,
          processing_status: note.processing_status || 'completed',
          tags: note.tags || [],
          metadata: note.metadata || {}
        }])
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Create AI note error:', err)
      return { data: null, error: err }
    }
  },

  updateAINote: async (noteId, updates) => {
    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .update(updates)
        .eq('id', noteId)
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('Update AI note error:', err)
      return { data: null, error: err }
    }
  },

  deleteAINote: async (noteId) => {
    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .delete()
        .eq('id', noteId)
      
      return { data, error }
    } catch (err) {
      console.error('Delete AI note error:', err)
      return { data: null, error: err }
    }
  },

  searchAINotes: async (query, userId) => {
    try {
      const { data, error } = await supabase
        .rpc('search_ai_notes', {
          search_query: query,
          user_uuid: userId
        })
      
      return { data, error }
    } catch (err) {
      console.error('Search AI notes error:', err)
      return { data: null, error: err }
    }
  },

  // File management
  uploadFile: async (file, noteId) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${noteId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ai-notes')
        .upload(fileName, file.uri, {
          contentType: file.mimeType,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Save file metadata
      const { data: fileData, error: fileError } = await supabase
        .from('ai_note_files')
        .insert([{
          ai_note_id: noteId,
          file_path: uploadData.path,
          file_name: file.name,
          file_type: file.mimeType,
          file_size: file.size,
          storage_bucket: 'ai-notes'
        }])
        .select()

      return { data: fileData, error: fileError }
    } catch (err) {
      console.error('Upload file error:', err)
      return { data: null, error: err }
    }
  },

  downloadFile: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('ai-notes')
        .download(filePath)
      
      return { data, error }
    } catch (err) {
      console.error('Download file error:', err)
      return { data: null, error: err }
    }
  },

  deleteFile: async (filePath, fileId) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('ai-notes')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete file record
      const { data, error } = await supabase
        .from('ai_note_files')
        .delete()
        .eq('id', fileId)

      return { data, error }
    } catch (err) {
      console.error('Delete file error:', err)
      return { data: null, error: err }
    }
  }
} 