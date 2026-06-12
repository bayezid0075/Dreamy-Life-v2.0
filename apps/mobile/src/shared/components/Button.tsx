import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  isLoading?: boolean;
}

const colors = {
  primary: '#5d5e64',
  'on-primary': '#ffffff',
  'on-surface': '#1c1b1b',
  'on-surface-variant': '#45474b',
  'surface-container-low': '#f6f3f2',
};

export default function Button({ title, onPress, variant = 'primary', disabled, isLoading }: ButtonProps) {
  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'secondary' && styles.secondary,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
  ];

  const textStyle = [
    styles.text,
    variant === 'primary' && styles.primaryText,
    variant === 'secondary' && styles.secondaryText,
    variant === 'ghost' && styles.ghostText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#5d5e64'} />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors['on-surface-variant'],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: colors['on-primary'],
  },
  secondaryText: {
    color: colors['on-surface'],
  },
  ghostText: {
    color: colors['on-surface-variant'],
  },
});
