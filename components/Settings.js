import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

export const SettingsSection = ({ title, children }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
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
  });

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View>{children}</View>
    </View>
  );
};

export const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'switch', iconColor, onPress }) => {
    const { colors } = useTheme();
  
    const styles = StyleSheet.create({
        settingItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 15,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
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
            color: colors.text,
        },
        settingSubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
        },
    });

    return (
        <TouchableOpacity onPress={onPress} disabled={!onPress && type !== 'switch'}>
        <View style={styles.settingItem}>
            <View style={styles.settingContent}>
            <Ionicons name={icon} size={24} color={iconColor || colors.primary} style={styles.settingIcon} />
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
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
}; 