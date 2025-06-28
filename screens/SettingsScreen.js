import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { SettingsSection, SettingItem } from '../components/Settings';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadUserData);
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await auth.getCurrentUser();
      if (authUser) {
        setUser(authUser);
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError) throw profileError;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await auth.signOut();
          if (error) Alert.alert('Error', 'Failed to logout');
        },
      },
    ]);
  };
  
  const handleKidModeToggle = () => {
    Alert.alert(
      "Kid Mode",
      "Kid Mode functionality is currently in development. This will allow you to set a PIN to restrict access to certain features."
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    scrollView: { flex: 1 },
    profileSection: { padding: 20, alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 20 },
    avatarContainer: { marginBottom: 15 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 28, fontWeight: 'bold', color: colors.textInverted },
    profileInfo: { alignItems: 'center' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 5 },
    profileEmail: { fontSize: 16, color: colors.textSecondary },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    statLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    logoutButton: { margin: 20, backgroundColor: colors.error, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
    logoutButtonText: { color: colors.textInverted, fontSize: 16, fontWeight: '600' },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.username || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
          {profile && (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.points ?? 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.level ?? 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>
          )}
        </View>

        <SettingsSection title="App Settings">
          <SettingItem icon="notifications-outline" title="Push Notifications" type="switch" value={true} onToggle={() => {}} />
          <SettingItem icon="finger-print-outline" title="Biometric Lock" type="switch" value={false} onToggle={() => {}} />
          <SettingItem 
            icon="contrast" 
            title="Dark Mode" 
            subtitle={isSystemTheme ? "System" : (isDark ? "On" : "Off")} 
            type="switch"
            value={isDark} 
            onToggle={toggleTheme} 
          />
        </SettingsSection>

        <SettingsSection title="Productivity">
          <SettingItem icon="timer-outline" title="Pomodoro Settings" type="arrow" onPress={() => navigation.navigate('PomodoroSettings')} />
        </SettingsSection>

        <SettingsSection title="Account">
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Kid Mode" 
            subtitle="Coming Soon"
            type="switch"
            value={profile?.kid_mode_enabled || false} 
            onToggle={handleKidModeToggle}
            iconColor={profile?.kid_mode_enabled ? colors.success : colors.textSecondary} 
          />
          <SettingItem icon="key-outline" title="Change Password" type="arrow" onPress={() => navigation.navigate('ChangePassword')} />
        </SettingsSection>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}