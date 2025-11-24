import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

interface Tab {
  name: string;
  label: string;
  icon: string;
  iconFocused: string;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const iconElement = options.tabBarIcon
            ? options.tabBarIcon({ focused: isFocused, color: '', size: 24 })
            : null;

          const iconName = iconElement?.props?.name || 'help-circle-outline';
          
          // Get proper label names
          const labelMap: { [key: string]: string } = {
            'Dashboard': 'Dashboard',
            'Places': 'Places',
            'Bookings': 'Bookings',
            'Customers': 'Customers',
            'Employees': 'Employees',
            'Rewards': 'Rewards',
            'Campaigns': 'Campaigns',
            'TimeOff': 'Time Off',
            'Messaging': 'Messaging',
            'Settings': 'Settings',
          };
          
          const label = labelMap[route.name] || options.tabBarLabel || route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={[styles.tab, isFocused && styles.tabFocused]}
            >
              <View style={styles.tabContent}>
                <MaterialCommunityIcons
                  name={iconName as any}
                  size={28}
                  color={isFocused ? '#1E90FF' : '#333333'}
                />
                <Text style={[styles.label, isFocused && styles.labelFocused]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingVertical: theme.spacing.md,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.backgroundLight,
    marginRight: theme.spacing.sm,
    minWidth: 80,
  },
  tabFocused: {
    backgroundColor: '#1E90FF20',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#333333',
    textAlign: 'center',
  },
  labelFocused: {
    color: '#1E90FF',
    fontWeight: theme.typography.fontWeight.bold,
  },
});

export default CustomTabBar;

