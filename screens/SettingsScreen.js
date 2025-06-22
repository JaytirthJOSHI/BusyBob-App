import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/supabase';
import { useTheme } from '../lib/theme';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme, isSystemTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    biometrics: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data } = await auth.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await auth.signOut();
              if (error) {
                Alert.alert('Error', 'Failed to logout');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const toggleSetting = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'switch', iconColor }) => (
    <View style={[styles.settingItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.settingContent}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={iconColor || colors.primary} 
          style={styles.settingIcon} 
        />
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
      {type === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    profileSection: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 20,
    },
    avatarContainer: {
      marginBottom: 15,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textInverted,
    },
    profileInfo: {
      alignItems: 'center',
    },
    profileName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    profileEmail: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
      marginHorizontal: 20,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
    },
    settingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 15,
    },
    settingText: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 3,
    },
    settingSubtitle: {
      fontSize: 14,
    },
    logoutButton: {
      margin: 20,
      backgroundColor: colors.error,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
    },
    logoutButtonText: {
      color: colors.textInverted,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || 
                 user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.user_metadata?.name || 'User'}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle="Get notified about tasks and reminders"
            value={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
          
          <SettingItem
            icon={isDark ? "sunny" : "moon"}
            title="Dark Mode"
            subtitle={`Currently using ${isDark ? 'dark' : 'light'} theme${isSystemTheme ? ' (system)' : ''}`}
            value={isDark}
            onToggle={handleThemeToggle}
          />
          
          <SettingItem 
            icon="finger-print"
            title="Biometric Authentication"
            subtitle="Use fingerprint or face recognition"
            value={settings.biometrics}
            onToggle={() => toggleSetting('biometrics')}
          />
        </View>

        {/* Academic Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Integration</Text>
          
          <TouchableOpacity>
            <SettingItem
              icon="school"
              title="Canvas LMS"
              subtitle="Connect your Canvas account"
              type="arrow"
              iconColor={colors.warning}
            />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <SettingItem
              icon="document-text"
              title="StudentVue"
              subtitle="Connect your StudentVue account"
              type="arrow"
              iconColor={colors.success}
            />
          </TouchableOpacity>
        </View>

        {/* Music Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music Integration</Text>
          
          <TouchableOpacity>
            <SettingItem
              icon="musical-notes"
              title="Spotify"
              subtitle="Connect your Spotify account"
              type="arrow"
              iconColor="#1db954"
            />
          </TouchableOpacity>
        </View>

        {/* Support & Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          
          <TouchableOpacity>
            <SettingItem
              icon="help-circle"
              title="Help & Support"
              subtitle="Get help and contact support"
              type="arrow"
            />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <SettingItem
              icon="document"
              title="Privacy Policy"
              subtitle="Read our privacy policy"
              type="arrow"
            />
          </TouchableOpacity>
          
          <TouchableOpacity>
            <SettingItem
              icon="information-circle"
              title="About"
              subtitle="App version and information"
              type="arrow"
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
} 