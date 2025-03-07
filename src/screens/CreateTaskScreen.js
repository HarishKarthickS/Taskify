import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import useSyncTasks from '../hooks/useSyncTasks';
import { TASK_PRIORITY, TASK_STATUS } from '../store/taskStore';
import { scheduleTaskReminderNotification } from '../utils/notifications';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CreateTaskScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { createTask } = useSyncTasks();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(TASK_PRIORITY.MEDIUM);
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Error state
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const titleShake = useSharedValue(0);
  
  // Animated style for error shake
  const animatedTitleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: titleShake.value }],
    };
  });
  
  // Handle priority selection
  const handlePrioritySelect = (newPriority) => {
    setPriority(newPriority);
  };
  
  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Set due date';
    return dayjs(date).format('ddd, MMM D, YYYY');
  };
  
  // Get color for priority button
  const getPriorityColor = (buttonPriority) => {
    switch (buttonPriority) {
      case TASK_PRIORITY.HIGH:
        return colors.error;
      case TASK_PRIORITY.MEDIUM:
        return colors.warning;
      case TASK_PRIORITY.LOW:
        return colors.success;
      default:
        return colors.info;
    }
  };
  
  // Validate form
  const validateForm = () => {
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      
      // Trigger shake animation
      titleShake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      
      isValid = false;
    } else {
      setTitleError('');
    }
    
    return isValid;
  };
  
  // Handle create task
  const handleCreateTask = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const newTask = {
        title,
        description,
        priority,
        dueDate: dueDate ? dueDate.toISOString() : null,
        status: TASK_STATUS.TODO,
      };
      
      const createdTask = await createTask(newTask);
      
      // Schedule notification if due date is set
      if (dueDate) {
        const notificationId = await scheduleTaskReminderNotification(createdTask);
        
        if (notificationId) {
          // Store notification ID with task for later cancellation if needed
          await createTask({
            ...createdTask,
            notificationId,
          });
        }
      }
      
      // Navigate back after successful creation
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar
          backgroundColor={colors.background}
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
        
        <Animated.View 
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Create New Task
          </Text>
        </Animated.View>
        
        {/* Title input */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(200)}
          style={[animatedTitleStyle, styles.inputContainer]}
        >
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.cardElevated,
                color: colors.text,
                borderColor: titleError ? colors.error : colors.border,
              },
            ]}
            placeholder="Enter task title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          {titleError ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {titleError}
            </Text>
          ) : null}
        </Animated.View>
        
        {/* Description input */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.inputContainer}
        >
          <Text style={[styles.label, { color: colors.text }]}>Description (optional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { 
                backgroundColor: colors.cardElevated,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter task description"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Animated.View>
        
        {/* Priority selection */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.inputContainer}
        >
          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={styles.priorityContainer}>
            {Object.values(TASK_PRIORITY).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: priority === p 
                      ? getPriorityColor(p) + '20' 
                      : colors.cardElevated,
                    borderColor: priority === p 
                      ? getPriorityColor(p) 
                      : colors.border,
                  },
                ]}
                onPress={() => handlePrioritySelect(p)}
              >
                <Icon 
                  name={
                    p === TASK_PRIORITY.HIGH 
                      ? 'flag' 
                      : p === TASK_PRIORITY.MEDIUM 
                        ? 'flag-outline' 
                        : 'flag-variant-outline'
                  } 
                  size={20} 
                  color={getPriorityColor(p)} 
                />
                <Text 
                  style={[
                    styles.priorityText, 
                    { color: getPriorityColor(p) },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
        
        {/* Due date picker */}
        <Animated.View 
          entering={FadeInDown.duration(400).delay(500)}
          style={styles.inputContainer}
        >
          <Text style={[styles.label, { color: colors.text }]}>Due Date (optional)</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { 
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color={colors.primary} />
            <Text 
              style={[
                styles.dateText, 
                { 
                  color: dueDate ? colors.text : colors.textMuted,
                },
              ]}
            >
              {formatDate(dueDate)}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </Animated.View>
        
        {/* Create button */}
        <Animated.View 
          entering={FadeInUp.duration(400).delay(600)}
          style={styles.buttonContainer}
        >
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: colors.primary },
              isSubmitting && { opacity: 0.7 },
            ]}
            onPress={handleCreateTask}
            disabled={isSubmitting}
          >
            <Text style={styles.createButtonText}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { borderColor: colors.primary },
            ]}
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
  },
  priorityText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginLeft: SPACING.md,
  },
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  createButton: {
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '500',
  },
});

export default CreateTaskScreen; 