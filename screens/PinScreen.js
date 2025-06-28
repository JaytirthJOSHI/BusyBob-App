import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

const PIN_LENGTH = 4;

export default function PinScreen({ route, navigation }) {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [firstPin, setFirstPin] = useState('');
  
  const { mode, onPinComplete } = route.params || {}; // mode: 'set' or 'enter'

  useEffect(() => {
    navigation.setOptions({
      title: mode === 'set' ? (isConfirming ? 'Confirm PIN' : 'Set New PIN') : 'Enter PIN',
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        color: colors.text,
      },
    });
  }, [mode, isConfirming, colors, navigation]);

  const handleKeyPress = (key) => {
    if (pin.length < PIN_LENGTH) {
      setPin(pin + key);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.substring(0, pin.length - 1));
    }
  };

  const handlePinFull = async () => {
    if (mode === 'set') {
      if (isConfirming) {
        if (pin === firstPin) {
          // PINs match, execute callback
          if (onPinComplete) onPinComplete(pin);
          navigation.goBack();
        } else {
          Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
          setPin('');
          setFirstPin('');
          setIsConfirming(false);
        }
      } else {
        // First PIN entered, now confirm
        setFirstPin(pin);
        setPin('');
        setIsConfirming(true);
      }
    } else { // mode === 'enter'
      if (onPinComplete) onPinComplete(pin);
      // The calling screen will handle verification and navigation
    }
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinFull();
    }
  }, [pin]);

  const PinDots = () => (
    <View style={styles.dotsContainer}>
      {[...Array(PIN_LENGTH)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { 
              backgroundColor: i < pin.length ? colors.primary : colors.border,
              borderColor: colors.border
            },
          ]}
        />
      ))}
    </View>
  );

  const KeypadButton = ({ value, onPress, isDelete = false }) => (
    <TouchableOpacity
      style={styles.keypadButton}
      onPress={() => onPress(value)}
    >
      {isDelete ? (
        <Ionicons name="backspace-outline" size={32} color={colors.text} />
      ) : (
        <Text style={[styles.keypadText, { color: colors.text }]}>{value}</Text>
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 50,
    },
    promptContainer: {
      alignItems: 'center',
    },
    promptText: {
      fontSize: 18,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    dotsContainer: {
      flexDirection: 'row',
      marginBottom: 50,
    },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      marginHorizontal: 10,
    },
    keypad: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      width: '80%',
    },
    keypadButton: {
      width: '33.3%',
      height: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    keypadText: {
      fontSize: 32,
      fontWeight: '300',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>
          {mode === 'set' 
            ? (isConfirming ? 'Confirm your new PIN' : 'Create a new PIN')
            : 'Enter your PIN to continue'}
        </Text>
        <PinDots />
      </View>
      
      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <KeypadButton key={num} value={num.toString()} onPress={handleKeyPress} />
        ))}
        <View style={styles.keypadButton} /> 
        <KeypadButton value="0" onPress={handleKeyPress} />
        <KeypadButton isDelete onPress={handleDelete} />
      </View>
    </SafeAreaView>
  );
}