import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { ThemeProvider } from './src/theme/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Ignore specific warnings
LogBox.ignoreLogs([
  'ViewPropTypes will be removed from React Native',
  'ColorPropType will be removed from React Native',
  // Add common React Navigation warnings
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  // Register for push notifications on app start
  useEffect(() => {
    // Wrap in try-catch to prevent app from crashing if notifications fail
    const setupNotifications = async () => {
      try {
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.log('Failed to register for notifications:', error);
        // Continue app execution even if notifications fail
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
