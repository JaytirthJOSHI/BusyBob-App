import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db, supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';

export default function SettingsScreen({ navigation }) {
  const { colors, isDark, toggleTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    biometrics: false,
    kidMode: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

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
        if (profileData) {
          setSettings(prev => ({ ...prev, kidMode: profileData.kid_mode_enabled || false }));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const { error } = await auth.signOut();
          if (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const toggleSetting = (setting) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    // In a real app, you would call an API to save this setting.
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'switch', iconColor, onPress }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.settingContent}>
          <Ionicons name={icon} size={24} color={iconColor || colors.primary} style={styles.settingIcon} />
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
          </View>
        </View>
        {type === 'switch' && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={value ? colors.textInverted : colors.textTertiary}
          />
        )}
        {type === 'arrow' && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

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
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 15, marginHorizontal: 20 },
    settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1 },
    settingContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    settingIcon: { marginRight: 15 },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 3 },
    settingSubtitle: { fontSize: 14 },
    logoutButton: { margin: 20, backgroundColor: colors.error, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
    logoutButtonText: { color: colors.textInverted, fontSize: 16, fontWeight: '600' },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Loading settings...</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <SettingItem icon="notifications-outline" title="Push Notifications" value={settings.notifications} onToggle={() => toggleSetting('notifications')} />
          <SettingItem icon="finger-print-outline" title="Biometric Lock" value={settings.biometrics} onToggle={() => toggleSetting('biometrics')} />
          <SettingItem icon="contrast" title="Dark Mode" subtitle={isSystemTheme ? "System" : (isDark ? "On" : "Off")} value={isDark} onToggle={toggleTheme} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productivity</Text>
          <SettingItem icon="timer-outline" title="Pomodoro Settings" type="arrow" onPress={() => Alert.alert("Navigate", "Navigate to Pomodoro Settings")} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem icon="shield-checkmark-outline" title="Kid Mode" subtitle={settings.kidMode ? "Enabled" : "Disabled"} value={settings.kidMode} onToggle={() => toggleSetting('kidMode')} iconColor={settings.kidMode ? colors.success : colors.textSecondary} />
          <SettingItem icon="key-outline" title="Change Password" type="arrow" onPress={() => Alert.alert("Navigate", "Navigate to Change Password")} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}