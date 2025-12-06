import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { navigationRef } from './navigationService';
import { LoadingScreen } from '../components/LoadingScreen';

// Import screens (will be created)
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import PlanSelectionScreen from '../screens/auth/PlanSelectionScreen';

import HomeScreen from '../screens/customer/HomeScreen';
import SearchScreen from '../screens/customer/SearchScreen';
import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import CustomerBookingsScreen from '../screens/customer/CustomerBookingsScreen';
import CustomerRewardsScreen from '../screens/customer/CustomerRewardsScreen';
import CustomerProfileScreen from '../screens/customer/CustomerProfileScreen';
import PlaceDetailsScreen from '../screens/customer/PlaceDetailsScreen';
import ServiceSelectionScreen from '../screens/customer/ServiceSelectionScreen';
import EmployeeSelectionScreen from '../screens/customer/EmployeeSelectionScreen';
import DateTimeSelectionScreen from '../screens/customer/DateTimeSelectionScreen';

import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';
import OwnerPlaceDetailsScreen from '../screens/owner/PlaceDetailsScreen';
import PlacesListScreen from '../screens/owner/PlacesListScreen';
import BookingsScreen from '../screens/owner/BookingsScreen';
import CustomersScreen from '../screens/owner/CustomersScreen';
import OwnerSettingsScreen from '../screens/owner/OwnerSettingsScreen';
import AddPlaceScreen from '../screens/owner/AddPlaceScreen';
import EditPlaceScreen from '../screens/owner/EditPlaceScreen';
import AddBookingScreen from '../screens/owner/AddBookingScreen';
import AddCustomerScreen from '../screens/owner/AddCustomerScreen';
import ServicesManagementScreen from '../screens/owner/ServicesManagementScreen';
import EmployeesManagementScreen from '../screens/owner/EmployeesManagementScreen';
import EmployeeFormScreen from '../screens/owner/EmployeeFormScreen';
import EmployeeServiceSelectionScreen from '../screens/owner/EmployeeServiceSelectionScreen';
import EmployeeDetailScreen from '../screens/owner/EmployeeDetailScreen';
import OwnerRewardsScreen from '../screens/owner/OwnerRewardsScreen';
import CampaignsScreen from '../screens/owner/CampaignsScreen';
import TimeOffScreen from '../screens/owner/TimeOffScreen';
import MessagingScreen from '../screens/owner/MessagingScreen';
import NotificationsScreen from '../screens/owner/NotificationsScreen';
import BillingScreen from '../screens/owner/BillingScreen';
import CustomTabBar from './CustomTabBar';

import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Customer Tab Navigator
const CustomerTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} topBorderColor="#000000" />}
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => {
        let iconName: any;

        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Search') {
          iconName = focused ? 'magnify' : 'magnify';
        } else if (route.name === 'Bookings') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Rewards') {
          iconName = focused ? 'gift' : 'gift-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'account' : 'account-outline';
        } else {
          iconName = 'help-circle-outline';
        }

        return <MaterialCommunityIcons name={iconName} size={24} color={focused ? '#1E90FF' : '#333333'} />;
      },
      tabBarLabel: route.name,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Bookings" component={CustomerBookingsScreen} />
    <Tab.Screen name="Rewards" component={CustomerRewardsScreen} />
    <Tab.Screen name="Profile" component={CustomerProfileScreen} />
  </Tab.Navigator>
);

// Owner Tab Navigator
const OwnerTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused }) => {
        let iconName: any;

        if (route.name === 'Dashboard') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Places') {
          iconName = focused ? 'office-building' : 'office-building-outline';
        } else if (route.name === 'Bookings') {
          iconName = focused ? 'calendar' : 'calendar-outline';
        } else if (route.name === 'Customers') {
          iconName = focused ? 'account-group' : 'account-group-outline';
        } else if (route.name === 'Staff') {
          iconName = focused ? 'account-tie' : 'account-tie-outline';
        } else if (route.name === 'Rewards') {
          iconName = focused ? 'gift' : 'gift-outline';
        } else if (route.name === 'Campaigns') {
          iconName = focused ? 'bullhorn' : 'bullhorn-outline';
        } else if (route.name === 'TimeOff') {
          iconName = focused ? 'calendar-clock' : 'calendar-clock-outline';
        } else if (route.name === 'Messaging') {
          iconName = focused ? 'message-text' : 'message-text-outline';
        } else if (route.name === 'Settings') {
          iconName = focused ? 'cog' : 'cog-outline';
        } else {
          iconName = 'help-circle-outline';
        }

        return <MaterialCommunityIcons name={iconName} size={24} color={focused ? '#1E90FF' : '#333333'} />;
      },
      tabBarLabel: route.name,
      headerShown: false,
    })}
  >
    <Tab.Screen name="Dashboard" component={OwnerDashboardScreen} />
    <Tab.Screen name="Places" component={PlacesListScreen} />
    <Tab.Screen name="Bookings" component={BookingsScreen} />
    <Tab.Screen name="Customers" component={CustomersScreen} />
    <Tab.Screen name="Staff" component={EmployeesManagementScreen} />
    <Tab.Screen name="Rewards" component={OwnerRewardsScreen} />
    <Tab.Screen name="Campaigns" component={CampaignsScreen} />
    <Tab.Screen name="TimeOff" component={TimeOffScreen} />
    <Tab.Screen name="Messaging" component={MessagingScreen} />
    <Tab.Screen name="Settings" component={OwnerSettingsScreen} />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isAdmin, isBusinessOwner, isCustomer, loading } = useAuth();

  // Reset navigation when authentication state changes
  useEffect(() => {
    if (!loading && navigationRef.isReady()) {
      if (!isAuthenticated) {
        // Reset to Welcome screen when logged out
        navigationRef.reset({
          index: 0,
          routes: [{ name: 'Welcome' as never }],
        });
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    // Return loading screen
    return <LoadingScreen />;
  }

  // Determine initial route based on authentication status and user type
  const getInitialRouteName = () => {
    if (!isAuthenticated) return "Welcome";
    if (isAdmin) return "AdminDashboard";
    if (isBusinessOwner) return "OwnerTabs";
    if (isCustomer) return "CustomerTabs";
    return "Welcome"; // Fallback
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={getInitialRouteName()}
        key={isAuthenticated ? 'authenticated' : 'unauthenticated'}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : isAdmin ? (
          // Admin Stack
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        ) : isBusinessOwner ? (
          // Owner Stack
          <>
            <Stack.Screen name="OwnerTabs" component={OwnerTabs} />
            <Stack.Screen name="PlaceDetails" component={OwnerPlaceDetailsScreen} />
            <Stack.Screen name="AddPlace" component={AddPlaceScreen} />
            <Stack.Screen name="EditPlace" component={EditPlaceScreen} />
            <Stack.Screen name="AddBooking" component={AddBookingScreen} />
            <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
            <Stack.Screen name="ServicesManagement" component={ServicesManagementScreen} />
            <Stack.Screen name="EmployeesManagement" component={EmployeesManagementScreen} />
            <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
            <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
            <Stack.Screen name="EmployeeServiceSelection" component={EmployeeServiceSelectionScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
          </>
        ) : (
          // Customer Stack
          <>
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
            <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
            <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
            <Stack.Screen name="EmployeeSelection" component={EmployeeSelectionScreen} />
            <Stack.Screen name="DateTimeSelection" component={DateTimeSelectionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

