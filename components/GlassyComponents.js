import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  Platform 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';

const { width: screenWidth } = Dimensions.get('window');

// Glassy Card Component
export const GlassyCard = ({ 
  children, 
  style, 
  intensity = 80, 
  tint = 'light',
  borderRadius = 16,
  ...props 
}) => {
  const { colors, isDark } = useTheme();
  
  if (Platform.OS === 'web') {
    // Web fallback with CSS backdrop-filter
    return (
      <View
        style={[
          {
            backgroundColor: colors.glass.background,
            borderRadius,
            borderWidth: 1,
            borderColor: colors.glass.border,
            shadowColor: colors.shadowGlass,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            // Web-specific glass effect
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={isDark ? 70 : intensity}  // Adjusted intensity for better dark mode
      tint={isDark ? 'dark' : tint}
      style={[
        {
          borderRadius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.glass.border,
          shadowColor: isDark ? colors.primary : colors.shadowGlass,  // Better shadow color for dark mode
          shadowOffset: { width: 0, height: isDark ? 12 : 8 },  // Stronger shadow in dark mode
          shadowOpacity: isDark ? 0.4 : 0.3,  // More prominent shadow in dark mode
          shadowRadius: isDark ? 24 : 20,     // Larger shadow radius in dark mode
          elevation: isDark ? 15 : 10,        // Higher elevation in dark mode
        },
        style,
      ]}
      {...props}
    >
      <View
        style={{
          backgroundColor: colors.glass.background,
          flex: 1,
          padding: 16,  // Default padding for better content spacing
        }}
      >
        {children}
      </View>
    </BlurView>
  );
};

// Glassy Button Component
export const GlassyButton = ({ 
  children, 
  style, 
  textStyle,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  ...props 
}) => {
  const { colors, isDark } = useTheme();
  
  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: [colors.primary, colors.primaryHover],
          text: colors.textInverted,
        };
      case 'secondary':
        return {
          background: [colors.secondary, colors.secondaryHover],
          text: colors.textInverted,
        };
      case 'glass':
        return {
          background: isDark 
            ? ['rgba(30, 41, 59, 0.6)', 'rgba(51, 65, 85, 0.4)']  // Better dark glass
            : ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)'], // More opaque light glass
          text: colors.text,
        };
      default:
        return {
          background: [colors.surface, colors.surfaceHover],
          text: colors.text,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 };
      case 'large':
        return { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <LinearGradient
        colors={buttonColors.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderRadius: 12,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            {
              color: buttonColors.text,
              fontSize: sizeStyles.fontSize,
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Floating Action Button
export const GlassyFAB = ({ 
  onPress, 
  icon, 
  style,
  size = 56,
  ...props 
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        },
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryHover]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        {icon}
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Glassy Input Field
export const GlassyTextInput = ({ 
  style, 
  placeholderTextColor,
  ...props 
}) => {
  const { colors } = useTheme();

  return (
    <GlassyCard
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginVertical: 8,
        },
        style,
      ]}
      intensity={60}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 16,
        }}
        placeholder={props.placeholder}
        placeholderTextColor={placeholderTextColor || colors.textSecondary}
        {...props}
      />
    </GlassyCard>
  );
};

// Animated Background
export const AnimatedGlassBackground = ({ children }) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={
          isDark 
            ? ['#0f172a', '#1e293b', '#0f172a'] // Matches updated dark theme
            : ['#f1f5f9', '#e2e8f0', '#f1f5f9'] // Matches updated light theme
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Animated floating orbs */}
      <View style={StyleSheet.absoluteFillObject}>
        <View
          style={[
            styles.floatingOrb,
            {
              backgroundColor: isDark 
                ? 'rgba(96, 165, 250, 0.15)'  // More visible in dark
                : 'rgba(59, 130, 246, 0.08)',
              top: '10%',
              left: '20%',
            },
          ]}
        />
        <View
          style={[
            styles.floatingOrb,
            {
              backgroundColor: isDark 
                ? 'rgba(168, 85, 247, 0.15)'  // More visible in dark
                : 'rgba(147, 51, 234, 0.08)',
              top: '60%',
              right: '15%',
              width: 150,
              height: 150,
            },
          ]}
        />
        <View
          style={[
            styles.floatingOrb,
            {
              backgroundColor: isDark 
                ? 'rgba(34, 197, 94, 0.15)'   // More visible in dark
                : 'rgba(16, 185, 129, 0.08)',
              bottom: '20%',
              left: '10%',
              width: 80,
              height: 80,
            },
          ]}
        />
      </View>
      
      {children}
    </View>
  );
};

// Glass Navigation Bar
export const GlassyTabBar = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <GlassyCard
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 20,
          paddingTop: 10,
          paddingHorizontal: 20,
        },
        style,
      ]}
      intensity={95}
      borderRadius={0}
    >
      {children}
    </GlassyCard>
  );
};

const styles = StyleSheet.create({
  floatingOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.8,  // Increased opacity for better visibility
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
});

export default {
  GlassyCard,
  GlassyButton,
  GlassyFAB,
  GlassyTextInput,
  AnimatedGlassBackground,
  GlassyTabBar,
}; 