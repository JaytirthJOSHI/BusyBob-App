import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/theme';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Password</Text>
    </View>
  );
}