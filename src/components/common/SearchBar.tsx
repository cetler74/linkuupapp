import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: () => void;
  onFocus?: () => void;
  style?: StyleProp<ViewStyle>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search for services or businesses',
  value,
  onChangeText,
  onSearch,
  onFocus,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.placeholderLight} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholderLight}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
          onFocus={onFocus}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.placeholderLight} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xs,
    // Removed default horizontal padding to allow parent to control width/padding
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 12, // More modern radius
    // borderWidth: 1, // Removed border for cleaner look
    // borderColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.md,
    height: 50,
    // ...theme.shadows.sm, // Removed shadow for flatter look on white background
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
});

export default SearchBar;
