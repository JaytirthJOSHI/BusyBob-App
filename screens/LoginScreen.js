import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import offlineStorage from '../lib/offlineStorage';
import { 
  AnimatedGlassBackground, 
  GlassyCard, 
  GlassyButton 
} from '../components/GlassyComponents';


export default function LoginScreen() {
  const { colors } = useTheme(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) { 
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Check if online
      const isOnline = await offlineStorage.isNetworkAvailable();
      
      if (!isOnline) {
        Alert.alert(
          'No Internet Connection',
          'You\'re offline. Would you like to use the app as a guest? Your data will be saved locally and synced when you\'re back online.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Use as Guest',
              onPress: handleGuestMode,
            },
          ]
        );
        return;
      }

      let result;
      if (isSignUp) {
        result = await auth.signUp(email, password, name);
      } else {
        result = await auth.signIn(email, password);
      }

      if (result.error) {
        Alert.alert('Authentication Error', result.error.message, [
          { text: 'OK' },
          {
            text: 'Use Offline',
            onPress: handleGuestMode,
          },
        ]);
      } else {
        // Success - user will be automatically redirected by the auth state listener
        if (isSignUp) {
          Alert.alert('Success', 'Account created successfully!');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Would you like to use the app offline?',
        [
          { text: 'Retry', onPress: handleAuth },
          {
            text: 'Use Offline',
            onPress: handleGuestMode,
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    try {
      await offlineStorage.enableGuestMode();
      Alert.alert(
        'Welcome Guest!',
        'You\'re now using BusyBob offline. All your data will be saved locally and synced when you connect to the internet and sign up.',
        [{ text: 'Get Started' }]
      );
    } catch (error) {
      console.error('Error enabling guest mode:', error);
      Alert.alert('Error', 'Failed to enable offline mode');
    }
  };

  const handleDirectGuestMode = () => {
    Alert.alert(
      'Use Offline',
      'Start using BusyBob without an account. Your data will be saved locally and you can create an account later to sync across devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: handleGuestMode,
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      textAlign: 'center',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 18,
      textAlign: 'center',
      color: colors.textSecondary,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.textTertiary,
      fontStyle: 'italic',
    },
    formCard: {
      padding: 24,
      marginBottom: 20,
    },
    input: {
      backgroundColor: colors.glass.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.glass.border,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    flexButton: {
      flex: 1,
      marginHorizontal: 4,
    },
    linkButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    linkText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    guestModeCard: {
      padding: 20,
      alignItems: 'center',
    },
    guestModeTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    guestModeSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 20,
    },
    offlineIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.warning + '20',
      borderRadius: 20,
      alignSelf: 'center',
    },
    offlineText: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 8,
    },
  });

  return (
    <AnimatedGlassBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <Text style={styles.title}>✨ BusyBob</Text>
              <Text style={styles.subtitle}>Your Student Productivity Hub</Text>
              <Text style={styles.tagline}>Tasks • Moods • Journal • Calendar</Text>
            </View>

            {/* Main Authentication Form */}
            <GlassyCard style={styles.formCard}>
              {isSignUp && (
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              )}
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <GlassyButton
                onPress={handleAuth}
                disabled={loading}
                variant="primary"
                size="large"
                style={{ marginBottom: 16 }}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
              </GlassyButton>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={styles.linkText}>
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </GlassyCard>

            {/* Guest Mode Option */}
            <GlassyCard style={styles.guestModeCard}>
              <Ionicons name="person-outline" size={32} color={colors.primary} />
              <Text style={styles.guestModeTitle}>Use Without Account</Text>
              <Text style={styles.guestModeSubtitle}>
                Start using BusyBob immediately without creating an account. 
                All your data will be saved locally and you can sync later.
              </Text>
              
              <GlassyButton
                onPress={handleDirectGuestMode}
                variant="glass"
                size="medium"
              >
                Continue as Guest
              </GlassyButton>
            </GlassyCard>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AnimatedGlassBackground>
  );
} 