import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import dayjs from 'dayjs';

// Configure notification behavior for the app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotificationsAsync = async () => {
  try {
    let token;
    
    // Skip notifications setup in simulators
    if (!Device.isDevice) {
      console.log('Push notifications are not available in simulator');
      return null;
    }
    
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (error) {
        console.log('Error setting up Android notification channel:', error);
        // Continue anyway
      }
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } catch (tokenError) {
      console.log('Error getting push token:', tokenError);
      return null;
    }
    
    return token;
  } catch (error) {
    console.log('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
};

// Schedule a notification for a task
export const scheduleTaskReminderNotification = async (task) => {
  // Only schedule if task has a due date
  if (!task.dueDate) return null;
  
  // Calculate when to send the notification (30 minutes before due date)
  const dueDate = dayjs(task.dueDate);
  const triggerDate = dueDate.subtract(30, 'minute').toDate();
  
  // Don't schedule if the due date is in the past
  if (dayjs().isAfter(triggerDate)) return null;
  
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `"${task.title}" is due in 30 minutes`,
        data: { taskId: task.id },
      },
      trigger: {
        date: triggerDate,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

// Cancel a scheduled notification
export const cancelNotification = async (notificationId) => {
  if (!notificationId) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Handle notification response
export const handleNotificationResponse = (response) => {
  const { taskId } = response.notification.request.content.data;
  
  // You can navigate to the task details screen here
  // Example: navigation.navigate('TaskDetails', { id: taskId });
};

// Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}; 