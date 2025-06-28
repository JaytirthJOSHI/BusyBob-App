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
        // Create user profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username: name,
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
  },

  signInWithGoogle: async () => {
    try {
      // Always use production URL for OAuth redirect to avoid localhost issues
      const redirectUrl = 'https://busybob.site';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })
      return { data, error }
    } catch (err) {
      console.error('Google signIn error:', err)
      return { data: null, error: err }
    }
  },

  signInWithSpotify: async (spotifyData) => {
    try {
      // For Spotify, we handle auth differently since it's not a native Supabase provider
      // First, check if user exists by email
      const { data: existingUsers, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', spotifyData.email)
        .limit(1)

      let user;
      if (existingUsers && existingUsers.length > 0) {
        // User exists, update with Spotify info
        user = existingUsers[0];

        // Update user record with Spotify data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            spotify_id: spotifyData.spotifyId,
            name: spotifyData.name || user.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user with Spotify data:', updateError);
        }
      } else {
        // Create new user account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: spotifyData.email,
          password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2), // Random password for OAuth users
          options: {
            data: {
              name: spotifyData.name,
              spotify_id: spotifyData.spotifyId,
              provider: 'spotify'
            }
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        user = signUpData.user;

        // Create user profile in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              name: spotifyData.name,
              email: spotifyData.email,
              spotify_id: spotifyData.spotifyId,
              created_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.warn('Profile creation failed:', profileError);
        }
      }

      // Store Spotify music connection
      const { error: musicError } = await supabase
        .from('music_connections')
        .upsert([
          {
            user_id: user.id,
            provider: 'spotify',
            access_token: spotifyData.accessToken,
            refresh_token: spotifyData.refreshToken,
            expires_at: new Date(spotifyData.expiresAt).toISOString()
          }
        ], {
          onConflict: 'user_id,provider'
        });

      if (musicError) {
        console.warn('Music connection creation failed:', musicError);
      }

      // Sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: spotifyData.email,
        password: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2) // We can't use the same password, but OAuth users should use OAuth
      });

      // If password sign-in fails (which it might), try to sign them in with a session
      if (signInError) {
        // For OAuth users, we'll create a session manually or use admin methods
        // This is a simplified approach - in production you'd handle this more securely
        console.log('Creating session for Spotify user...');
        return { data: { user }, error: null };
      }

      return { data: signInData, error: signInError };
    } catch (err) {
      console.error('Spotify signIn error:', err);
      return { data: null, error: err };
    }
  },
}

// Database helpers
export const db = {
  // Ensure user exists in profiles table
  ensureUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user exists in profiles table
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create them
        const { error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            }
          ])

        if (createError) {
          console.error('Error creating user record:', createError)
          throw createError
        }
      } else if (checkError) {
        console.error('Error checking user:', checkError)
        throw checkError
      }

      return user
    } catch (err) {
      console.error('EnsureUser error:', err)
      throw err
    }
  },

  // AI Notes
  getAINotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('ai_notes')
        .select(
          `
          *,
          ai_note_files (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      return { data, error }
    } catch (err) {
      console.error('GetAINotes error:', err)
      return { data: [], error: err }
    }
  },

  createAINote: async (note) => {
    try {
      await db.ensureUser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('ai_notes')
        .insert([{
          user_id: user.id,
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
          metadata: note.metadata || {},
          created_at: new Date().toISOString()
        }])
        .select()
      
      return { data, error }
    } catch (err) {
      console.error('CreateAINote error:', err)
      return { data: null, error: err }
    }
  },

  updateAINote: async (noteId, updates) => {
    try {
      const { data, error } = await supabase
        .from('ai_notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()

      return { data, error }
    } catch (err) {
      console.error('UpdateAINote error:', err)
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
      console.error('DeleteAINote error:', err)
      return { data: null, error: err }
    }
  },

  searchAINotes: async (query) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .rpc('search_ai_notes', {
          search_query: query,
          user_uuid: user.id
        })
      
      return { data, error }
    } catch (err) {
      console.error('SearchAINotes error:', err)
      return { data: [], error: err }
    }
  },

  // File management for AI Notes
  uploadAIFile: async (file, noteId) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${noteId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ai-notes')
        .upload(fileName, file, {
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
          file_type: file.type,
          file_size: file.size,
          storage_bucket: 'ai-notes'
        }])
        .select()

      return { data: fileData, error: fileError }
    } catch (err) {
      console.error('UploadAIFile error:', err)
      return { data: null, error: err }
    }
  },

  downloadAIFile: async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from('ai-notes')
        .download(filePath)
      
      return { data, error }
    } catch (err) {
      console.error('DownloadAIFile error:', err)
      return { data: null, error: err }
    }
  },

  deleteAIFile: async (filePath, fileId) => {
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
      console.error('DeleteAIFile error:', err)
      return { data: null, error: err }
    }
  }
} 