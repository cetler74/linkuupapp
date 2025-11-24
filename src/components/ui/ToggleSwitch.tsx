import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onValueChange, disabled = false }) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        value && styles.containerActive,
        disabled && styles.containerDisabled,
      ]}
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={[styles.thumb, value && styles.thumbActive]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.borderLight,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  containerActive: {
    backgroundColor: theme.colors.primary,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    ...theme.shadows.sm,
  },
  thumbActive: {
    transform: [{ translateX: 20 }],
  },
});

export default ToggleSwitch;

