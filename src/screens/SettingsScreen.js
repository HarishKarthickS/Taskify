import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import useSyncTasks from '../hooks/useSyncTasks';
import useTaskStore from '../store/taskStore';
import { getAllScheduledNotifications, cancelNotification } from '../utils/notifications';

const SettingItem = ({ icon, title, description, right, onPress, delay = 0 }) => {
  const { colors } = useTheme();
  
  return (
    <Animated.View
      entering={SlideInRight.duration(400).delay(delay)}
    >
      <TouchableOpacity
        style={[
          styles.settingItem,
          { backgroundColor: colors.cardElevated },
          SHADOWS.light,
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Icon name={icon} size={22} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {title}
            </Text>
            {description ? (
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {description}
              </Text>
            ) : null}
          </View>
        </View>
        
        <View style={styles.settingItemRight}>
          {right}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SectionHeader = ({ title, delay = 0 }) => {
  const { colors } = useTheme();
  
  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(delay)}
      style={styles.sectionHeader}
    >
      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
        {title}
      </Text>
    </Animated.View>
  );
};

const SettingsScreen = () => {
  const { colors, isDarkMode, toggleTheme, setIsSystemTheme } = useTheme();
  const { forceSync, isOnline, isSyncing } = useSyncTasks();
  const resetStore = useTaskStore(state => state.resetStore);
  
  const [isSystemTheme, setSystemTheme] = useState(true);
  
  // Handle system theme toggle
  const handleSystemThemeToggle = (value) => {
    setSystemTheme(value);
    setIsSystemTheme(value);
  };
  
  // Handle clear all data
  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all tasks? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            // Cancel all scheduled notifications
            const notifications = await getAllScheduledNotifications();
            for (const notification of notifications) {
              await cancelNotification(notification.identifier);
            }
            
            // Reset the store
            resetStore();
            
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };
  
  // Manual sync
  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Error', 'You are currently offline. Please check your connection and try again.');
      return;
    }
    
    try {
      await forceSync();
      Alert.alert('Success', 'Tasks synchronized successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to synchronize tasks. Please try again later.');
    }
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      
      <Animated.View 
        entering={FadeIn.duration(400)}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
      </Animated.View>
      
      {/* Appearance section */}
      <SectionHeader title="Appearance" delay={100} />
      
      <SettingItem
        icon="theme-light-dark"
        title="Dark Mode"
        description="Toggle between light and dark mode"
        delay={200}
        right={
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            disabled={isSystemTheme}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={isDarkMode ? colors.primary : colors.textMuted}
          />
        }
      />
      
      <SettingItem
        icon="cellphone-cog"
        title="Use System Theme"
        description="Automatically match your device theme"
        delay={300}
        right={
          <Switch
            value={isSystemTheme}
            onValueChange={handleSystemThemeToggle}
            trackColor={{ false: colors.border, true: colors.primary + '80' }}
            thumbColor={isSystemTheme ? colors.primary : colors.textMuted}
          />
        }
      />
      
      {/* Data & Sync section */}
      <SectionHeader title="Data & Sync" delay={400} />
      
      <SettingItem
        icon="sync"
        title="Sync Now"
        description={isOnline ? "Manually sync your tasks" : "You're offline"}
        delay={500}
        onPress={handleManualSync}
        right={
          <Icon 
            name={isOnline ? "cloud-sync" : "cloud-off-outline"} 
            size={24} 
            color={isOnline ? colors.primary : colors.warning} 
          />
        }
      />
      
      <SettingItem
        icon="delete-sweep"
        title="Clear All Data"
        description="Delete all tasks and start fresh"
        delay={600}
        onPress={handleClearAllData}
        right={
          <Icon name="trash-can-outline" size={24} color={colors.error} />
        }
      />
      
      {/* About section */}
      <SectionHeader title="About" delay={700} />
      
      <SettingItem
        icon="information"
        title="Version"
        description="Taskify v1.0.0"
        delay={800}
      />
      
      <SettingItem
        icon="github"
        title="Source Code"
        description="View the project on GitHub"
        delay={900}
        right={
          <Icon name="open-in-new" size={24} color={colors.primary} />
        }
      />
      
      {/* Add spacing at the bottom */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
  },
  sectionHeader: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  sectionHeaderText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 12,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTextContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  settingItemRight: {
    marginLeft: SPACING.md,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default SettingsScreen; 