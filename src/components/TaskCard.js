import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  useAnimatedGestureHandler,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { useTheme } from '../theme/ThemeContext';
import { SHADOWS, TYPOGRAPHY, SPACING } from '../theme';
import { TASK_PRIORITY, TASK_STATUS } from '../store/taskStore';

const TaskCard = ({ 
  task, 
  onComplete, 
  onDelete, 
  isKanban = false,
  onDragStart,
  onDragEnd,
  enabled = true,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const isCompleted = task.status === TASK_STATUS.DONE;
  
  // Reset animations when task changes
  useEffect(() => {
    cardScale.value = withSpring(1);
    cardOpacity.value = withTiming(1, { duration: 300 });
    translateX.value = withSpring(0);
  }, [task]);
  
  // Handle pan gesture for swipe-to-complete
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      if (onDragStart && !isKanban) {
        runOnJS(onDragStart)();
      }
    },
    onActive: (event) => {
      if (isKanban) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        cardScale.value = 1.05;
        cardOpacity.value = 0.9;
      } else {
        translateX.value = event.translationX;
      }
    },
    onEnd: (event) => {
      if (isKanban) {
        // Handle for kanban drag
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        cardScale.value = withSpring(1);
        cardOpacity.value = withTiming(1, { duration: 300 });
        
        if (onDragEnd) {
          runOnJS(onDragEnd)({
            task,
            x: event.absoluteX,
            y: event.absoluteY,
          });
        }
      } else {
        // Handle for swipe-to-complete/delete
        const shouldComplete = event.translationX > 100;
        const shouldDelete = event.translationX < -100;
        
        if (shouldComplete && onComplete) {
          translateX.value = withTiming(500, { duration: 500 }, () => {
            runOnJS(onComplete)(task.id);
          });
        } else if (shouldDelete && onDelete) {
          translateX.value = withTiming(-500, { duration: 500 }, () => {
            runOnJS(onDelete)(task.id);
          });
        } else {
          translateX.value = withSpring(0);
        }
      }
    },
  });
  
  // Animated styles
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: cardScale.value },
      ],
      opacity: cardOpacity.value,
      backgroundColor: isCompleted 
        ? interpolate(
            translateX.value,
            [-100, 0, 100],
            [colors.cardElevated, colors.cardElevated, colors.cardElevated],
            Extrapolate.CLAMP
          ) 
        : interpolate(
            translateX.value,
            [-100, 0, 100],
            [colors.error, colors.cardElevated, colors.success],
            Extrapolate.CLAMP
          ),
    };
  });
  
  // Background styling to show behind the card when swiping
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const completeOpacity = interpolate(
      translateX.value,
      [0, 100],
      [0, 1],
      Extrapolate.CLAMP
    );
    
    const deleteOpacity = interpolate(
      translateX.value,
      [-100, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: isCompleted ? 0 : 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.lg,
    };
  });
  
  // Get priority color
  const getPriorityColor = () => {
    switch (task.priority) {
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
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundLayer, animatedBackgroundStyle]}>
        <View style={[styles.actionIndicator, { backgroundColor: colors.error }]}>
          <Icon name="trash-can-outline" color="white" size={24} />
          <Text style={[styles.actionText, { color: 'white' }]}>Delete</Text>
        </View>
        <View style={[styles.actionIndicator, { backgroundColor: colors.success }]}>
          <Icon name="check" color="white" size={24} />
          <Text style={[styles.actionText, { color: 'white' }]}>Complete</Text>
        </View>
      </Animated.View>
      
      <PanGestureHandler onGestureEvent={panGestureHandler} enabled={enabled}>
        <Animated.View style={[styles.card, animatedCardStyle, SHADOWS.medium]}>
          <Pressable 
            onPress={() => navigation.navigate('TaskDetails', { id: task.id })}
            style={styles.cardContent}
          >
            {/* Priority indicator */}
            <View 
              style={[
                styles.priorityIndicator, 
                { backgroundColor: getPriorityColor() }
              ]} 
            />
            
            {/* Task info */}
            <View style={styles.taskInfo}>
              <Text 
                style={[
                  styles.title, 
                  { color: colors.text },
                  isCompleted && styles.completedText
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              
              {task.description ? (
                <Text 
                  style={[
                    styles.description, 
                    { color: colors.textSecondary },
                    isCompleted && styles.completedText
                  ]}
                  numberOfLines={2}
                >
                  {task.description}
                </Text>
              ) : null}
              
              <View style={styles.metaContainer}>
                {task.dueDate ? (
                  <View style={styles.dueDateContainer}>
                    <Icon 
                      name="calendar" 
                      size={14} 
                      color={
                        isCompleted 
                          ? colors.textMuted 
                          : dayjs(task.dueDate).isBefore(dayjs(), 'day') 
                            ? colors.error 
                            : colors.textSecondary
                      } 
                    />
                    <Text 
                      style={[
                        styles.dueDate, 
                        { 
                          color: isCompleted 
                            ? colors.textMuted 
                            : dayjs(task.dueDate).isBefore(dayjs(), 'day') 
                              ? colors.error 
                              : colors.textSecondary
                        },
                        isCompleted && styles.completedText
                      ]}
                    >
                      {dayjs(task.dueDate).format('MMM D')}
                    </Text>
                  </View>
                ) : null}
                
                {!isKanban && (
                  <View 
                    style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: isCompleted 
                          ? colors.success + '40' 
                          : task.status === TASK_STATUS.IN_PROGRESS 
                            ? colors.warning + '40' 
                            : colors.info + '40' 
                      }
                    ]}
                  >
                    <Text style={[
                      styles.statusText, 
                      { 
                        color: isCompleted 
                          ? colors.success 
                          : task.status === TASK_STATUS.IN_PROGRESS 
                            ? colors.warning 
                            : colors.info 
                      }
                    ]}>
                      {task.status}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
  },
  backgroundLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  actionIndicator: {
    padding: SPACING.md,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: SPACING.xs,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.lg,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: SPACING.md,
  },
  taskInfo: {
    flex: 1,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.md,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginLeft: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: 'bold',
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
});

export default TaskCard; 