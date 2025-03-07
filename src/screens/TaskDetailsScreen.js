import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import useTaskStore, { TASK_PRIORITY, TASK_STATUS } from '../store/taskStore';
import useSyncTasks from '../hooks/useSyncTasks';
import { scheduleTaskReminderNotification, cancelNotification } from '../utils/notifications';

const TaskDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { colors, isDarkMode } = useTheme();
  const { updateTaskAndSync, deleteTaskAndSync } = useSyncTasks();
  
  // Get task from store
  const tasks = useTaskStore(state => state.tasks);
  const task = tasks.find(t => t.id === id);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Animation values
  const editModeOpacity = useSharedValue(0);
  const viewModeOpacity = useSharedValue(1);
  
  // Animation styles
  const editModeStyle = useAnimatedStyle(() => ({
    opacity: editModeOpacity.value,
    display: editModeOpacity.value === 0 ? 'none' : 'flex',
  }));
  
  const viewModeStyle = useAnimatedStyle(() => ({
    opacity: viewModeOpacity.value,
    display: viewModeOpacity.value === 0 ? 'none' : 'flex',
  }));
  
  // Initialize edit form with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    }
  }, [task]);
  
  // Toggle edit mode with animation
  const toggleEditMode = () => {
    if (isEditMode) {
      // Switching back to view mode
      editModeOpacity.value = withTiming(0, { duration: 300 });
      viewModeOpacity.value = withTiming(1, { duration: 300 });
      
      // Reset form to original values
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
    } else {
      // Switching to edit mode
      editModeOpacity.value = withTiming(1, { duration: 300 });
      viewModeOpacity.value = withTiming(0, { duration: 300 });
    }
    
    setIsEditMode(!isEditMode);
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
    if (!date) return 'No due date';
    return dayjs(date).format('ddd, MMM D, YYYY');
  };
  
  // Get color for priority
  const getPriorityColor = (p) => {
    switch (p) {
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
  
  // Get color for status
  const getStatusColor = (s) => {
    switch (s) {
      case TASK_STATUS.DONE:
        return colors.success;
      case TASK_STATUS.IN_PROGRESS:
        return colors.warning;
      case TASK_STATUS.TODO:
        return colors.info;
      default:
        return colors.textSecondary;
    }
  };
  
  // Handle save changes
  const handleSaveChanges = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }
    
    const updatedTask = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? dueDate.toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    
    // Handle notification updates
    if (task.notificationId && (!dueDate || task.status === TASK_STATUS.DONE)) {
      // Cancel notification if due date is removed or task is completed
      await cancelNotification(task.notificationId);
      updatedTask.notificationId = null;
    } else if (dueDate && (!task.dueDate || (task.dueDate && dueDate.getTime() !== new Date(task.dueDate).getTime()))) {
      // Schedule new notification if due date is added or changed
      if (task.notificationId) {
        await cancelNotification(task.notificationId);
      }
      
      const tempTask = { ...task, ...updatedTask };
      const notificationId = await scheduleTaskReminderNotification(tempTask);
      
      if (notificationId) {
        updatedTask.notificationId = notificationId;
      }
    }
    
    // Update task
    await updateTaskAndSync(id, updatedTask);
    
    // Exit edit mode
    toggleEditMode();
  };
  
  // Handle delete task
  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (task.notificationId) {
              await cancelNotification(task.notificationId);
            }
            await deleteTaskAndSync(id);
            navigation.goBack();
          }
        },
      ]
    );
  };
  
  // Show completion date if task is done
  const showCompletionDate = () => {
    if (task && task.status === TASK_STATUS.DONE && task.completedAt) {
      return (
        <View style={styles.infoRow}>
          <Icon name="check-circle" size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Completed on {dayjs(task.completedAt).format('MMM D, YYYY')}
          </Text>
        </View>
      );
    }
    return null;
  };
  
  // If task not found
  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
          Task not found
        </Text>
      </View>
    );
  }
  
  // Format created date for display
  const createdDateFormatted = dayjs(task.createdAt).format('MMM D, YYYY');
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      
      {/* View Mode */}
      <Animated.View style={[styles.contentContainer, viewModeStyle]}>
        {/* Task Title */}
        <Animated.Text
          entering={FadeIn.duration(400)}
          style={[styles.title, { color: colors.text }]}
        >
          {task.title}
        </Animated.Text>
        
        {/* Task Info */}
        <View style={styles.infoContainer}>
          {/* Priority */}
          <Animated.View
            entering={SlideInRight.duration(400).delay(100)}
            style={styles.infoRow}
          >
            <Icon
              name={
                task.priority === TASK_PRIORITY.HIGH
                  ? 'flag'
                  : task.priority === TASK_PRIORITY.MEDIUM
                    ? 'flag-outline'
                    : 'flag-variant-outline'
              }
              size={20}
              color={getPriorityColor(task.priority)}
            />
            <Text
              style={[
                styles.infoText,
                { color: getPriorityColor(task.priority) },
              ]}
            >
              {task.priority} Priority
            </Text>
          </Animated.View>
          
          {/* Status */}
          <Animated.View
            entering={SlideInRight.duration(400).delay(200)}
            style={styles.infoRow}
          >
            <Icon
              name={
                task.status === TASK_STATUS.DONE
                  ? 'check-circle'
                  : task.status === TASK_STATUS.IN_PROGRESS
                    ? 'progress-clock'
                    : 'clock-outline'
              }
              size={20}
              color={getStatusColor(task.status)}
            />
            <Text
              style={[
                styles.infoText,
                { color: getStatusColor(task.status) },
              ]}
            >
              {task.status}
            </Text>
          </Animated.View>
          
          {/* Due Date */}
          {task.dueDate && (
            <Animated.View
              entering={SlideInRight.duration(400).delay(300)}
              style={styles.infoRow}
            >
              <Icon
                name="calendar"
                size={20}
                color={
                  task.status === TASK_STATUS.DONE
                    ? colors.textMuted
                    : dayjs(task.dueDate).isBefore(dayjs(), 'day')
                      ? colors.error
                      : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color: task.status === TASK_STATUS.DONE
                      ? colors.textMuted
                      : dayjs(task.dueDate).isBefore(dayjs(), 'day')
                        ? colors.error
                        : colors.textSecondary,
                  },
                ]}
              >
                Due {formatDate(new Date(task.dueDate))}
              </Text>
            </Animated.View>
          )}
          
          {/* Created Date */}
          <Animated.View
            entering={SlideInRight.duration(400).delay(400)}
            style={styles.infoRow}
          >
            <Icon name="calendar-plus" size={20} color={colors.textMuted} />
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Created on {createdDateFormatted}
            </Text>
          </Animated.View>
          
          {/* Completion Date (if applicable) */}
          {showCompletionDate()}
        </View>
        
        {/* Task Description */}
        {task.description ? (
          <Animated.View
            entering={FadeIn.duration(400).delay(500)}
            style={styles.descriptionContainer}
          >
            <Text style={[styles.descriptionLabel, { color: colors.text }]}>
              Description
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {task.description}
            </Text>
          </Animated.View>
        ) : null}
        
        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={toggleEditMode}
          >
            <Icon name="pencil" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={handleDeleteTask}
          >
            <Icon name="trash-can-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Edit Mode */}
      <Animated.View style={[styles.contentContainer, editModeStyle]}>
        <Text style={[styles.editModeTitle, { color: colors.text }]}>
          Edit Task
        </Text>
        
        {/* Title Input */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.cardElevated,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="Enter task title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>
        
        {/* Description Input */}
        <View style={styles.inputContainer}>
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
        </View>
        
        {/* Priority Selection */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Priority</Text>
          <View style={styles.radioContainer}>
            {Object.values(TASK_PRIORITY).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.radioButton,
                  {
                    backgroundColor: priority === p 
                      ? getPriorityColor(p) + '20' 
                      : colors.cardElevated,
                    borderColor: priority === p 
                      ? getPriorityColor(p) 
                      : colors.border,
                  },
                ]}
                onPress={() => setPriority(p)}
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
                    styles.radioText, 
                    { color: getPriorityColor(p) },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Status Selection */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Status</Text>
          <View style={styles.radioContainer}>
            {Object.values(TASK_STATUS).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.radioButton,
                  {
                    backgroundColor: status === s 
                      ? getStatusColor(s) + '20' 
                      : colors.cardElevated,
                    borderColor: status === s 
                      ? getStatusColor(s) 
                      : colors.border,
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <Icon 
                  name={
                    s === TASK_STATUS.DONE 
                      ? 'check-circle' 
                      : s === TASK_STATUS.IN_PROGRESS 
                        ? 'progress-clock' 
                        : 'clock-outline'
                  } 
                  size={20} 
                  color={getStatusColor(s)} 
                />
                <Text 
                  style={[
                    styles.radioText, 
                    { color: getStatusColor(s) },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Due Date Picker */}
        <View style={styles.inputContainer}>
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
              {dueDate ? formatDate(dueDate) : 'No due date'}
            </Text>
            
            {dueDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setDueDate(null)}
              >
                <Icon name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dueDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>
        
        {/* Save/Cancel Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveChanges}
          >
            <Icon name="content-save" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Save Changes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.textSecondary }]}
            onPress={toggleEditMode}
          >
            <Icon name="close" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  infoContainer: {
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginLeft: SPACING.md,
  },
  descriptionContainer: {
    marginBottom: SPACING.xl,
  },
  descriptionLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: 12,
    flex: 0.48,
    ...SHADOWS.medium,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
  notFoundText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'center',
    marginTop: 100,
  },
  editModeTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.xl,
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
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioButton: {
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
  radioText: {
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
    flex: 1,
  },
  clearDateButton: {
    marginLeft: SPACING.md,
  },
});

export default TaskDetailsScreen; 