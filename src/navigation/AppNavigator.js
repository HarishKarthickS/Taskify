import React, { useState, useEffect } from 'react';
import { Platform, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import KanbanScreen from '../screens/KanbanScreen';
import CreateTaskScreen from '../screens/CreateTaskScreen';
import TaskDetailsScreen from '../screens/TaskDetailsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CalendarScreen from '../screens/CalendarScreen';

// Import theme hook
import { useTheme } from '../theme/ThemeContext';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Loading screen component
const LoadingScreen = ({ error }) => {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      {error ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: colors.error, fontSize: 16, marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            {error.toString()}
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: colors.primary, 
              paddingHorizontal: 20, 
              paddingVertical: 10, 
              borderRadius: 8 
            }}
            onPress={() => window.location.reload()}
          >
            <Text style={{ color: '#FFF' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 20, color: colors.text, fontSize: 16 }}>
            Loading Taskify...
          </Text>
        </>
      )}
    </View>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardElevated,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        headerStyle: {
          backgroundColor: colors.cardElevated,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Kanban" 
        component={KanbanScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="CreateTask" 
        component={CreateTaskScreen} 
        options={{
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              style={{
                top: -20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon 
                name="plus-circle" 
                color={colors.primary} 
                size={60}
                style={{
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 5,
                }}
              />
            </TouchableOpacity>
          ),
          tabBarLabel: () => null,
          title: 'Create Task',
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Simulate initialization with a small delay
  useEffect(() => {
    const initTimer = setTimeout(() => {
      try {
        // If any initialization logic is needed, it can go here
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(err);
        setIsLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // Show error screen if something went wrong
  if (error) {
    return <LoadingScreen error={error} />;
  }
  
  return (
    <NavigationContainer
      theme={{
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.cardElevated,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        dark: colors === 'dark',
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.cardElevated,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Tabs" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="TaskDetails" 
          component={TaskDetailsScreen} 
          options={{ title: 'Task Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 