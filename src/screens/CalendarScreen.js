import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import TaskCard from '../components/TaskCard';
import useTaskStore from '../store/taskStore';
import useSyncTasks from '../hooks/useSyncTasks';

// Helper to generate calendar days
const generateCalendarDays = (selectedDate) => {
  const startOfMonth = dayjs(selectedDate).startOf('month');
  const endOfMonth = dayjs(selectedDate).endOf('month');
  const startDay = startOfMonth.day(); // 0 is Sunday
  
  // Generate days from previous month to fill the first week
  const prevMonthDays = [];
  for (let i = 0; i < startDay; i++) {
    prevMonthDays.push({
      date: startOfMonth.subtract(startDay - i, 'day'),
      isCurrentMonth: false,
    });
  }
  
  // Generate days for current month
  const currentMonthDays = [];
  for (let i = 1; i <= endOfMonth.date(); i++) {
    currentMonthDays.push({
      date: dayjs(selectedDate).date(i),
      isCurrentMonth: true,
    });
  }
  
  // Generate days from next month to fill the last week
  const nextMonthDays = [];
  const remainingDays = (7 - ((prevMonthDays.length + currentMonthDays.length) % 7)) % 7;
  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({
      date: endOfMonth.add(i, 'day'),
      isCurrentMonth: false,
    });
  }
  
  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

const CalendarScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const tasks = useTaskStore(state => state.tasks);
  const { updateTaskAndSync, deleteTaskAndSync } = useSyncTasks();
  
  // State for selected date and calendar days
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [calendarDays, setCalendarDays] = useState([]);
  const [selectedDayTasks, setSelectedDayTasks] = useState([]);
  
  // Generate calendar days when month changes
  useEffect(() => {
    const days = generateCalendarDays(selectedDate);
    setCalendarDays(days);
  }, [selectedDate]);
  
  // Filter tasks for selected day
  useEffect(() => {
    const filteredTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return dayjs(task.dueDate).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
    });
    
    setSelectedDayTasks(filteredTasks);
  }, [tasks, selectedDate]);
  
  // Navigate to previous month
  const goToPrevMonth = () => {
    setSelectedDate(selectedDate.subtract(1, 'month'));
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    setSelectedDate(selectedDate.add(1, 'month'));
  };
  
  // Go to today
  const goToToday = () => {
    setSelectedDate(dayjs());
  };
  
  // Select a day
  const selectDay = (day) => {
    setSelectedDate(day.date);
  };
  
  // Handle complete task
  const handleCompleteTask = (taskId) => {
    updateTaskAndSync(taskId, {
      status: 'DONE',
      completedAt: new Date().toISOString(),
    });
  };
  
  // Handle delete task
  const handleDeleteTask = (taskId) => {
    deleteTaskAndSync(taskId);
  };
  
  // Render calendar day
  const renderCalendarDay = ({ item, index }) => {
    const isToday = item.date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    const isSelected = item.date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
    
    // Check if day has tasks
    const hasTasks = tasks.some(task => 
      task.dueDate && dayjs(task.dueDate).format('YYYY-MM-DD') === item.date.format('YYYY-MM-DD')
    );
    
    return (
      <TouchableOpacity
        style={[
          styles.calendarDay,
          !item.isCurrentMonth && styles.notCurrentMonth,
          isSelected && [styles.selectedDay, { backgroundColor: colors.primary }],
        ]}
        onPress={() => selectDay(item)}
      >
        <Text
          style={[
            styles.dayText,
            !item.isCurrentMonth && { color: colors.textMuted },
            isSelected && { color: '#FFFFFF' },
            isToday && !isSelected && { color: colors.primary, fontWeight: 'bold' },
          ]}
        >
          {item.date.date()}
        </Text>
        
        {hasTasks && !isSelected && (
          <View
            style={[
              styles.taskIndicator,
              { backgroundColor: item.isCurrentMonth ? colors.primary : colors.textMuted },
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };
  
  // Render task item
  const renderTaskItem = ({ item }) => (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <TaskCard
        task={item}
        onComplete={handleCompleteTask}
        onDelete={handleDeleteTask}
      />
    </Animated.View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Calendar
        </Text>
        
        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: colors.primary }]}
          onPress={goToToday}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
      
      {/* Month navigation */}
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.cardElevated }]}
          onPress={goToPrevMonth}
        >
          <Icon name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={[styles.monthYearText, { color: colors.text }]}>
          {selectedDate.format('MMMM YYYY')}
        </Text>
        
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: colors.cardElevated }]}
          onPress={goToNextMonth}
        >
          <Icon name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Weekday headers */}
      <View style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <Text
            key={day}
            style={[
              styles.weekdayText,
              { color: index === 0 || index === 6 ? colors.primary : colors.textSecondary },
            ]}
          >
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        <FlatList
          data={calendarDays}
          renderItem={renderCalendarDay}
          keyExtractor={(item) => item.date.format('YYYY-MM-DD')}
          numColumns={7}
          scrollEnabled={false}
        />
      </View>
      
      {/* Selected day info */}
      <View style={styles.selectedDayInfo}>
        <Text style={[styles.selectedDayText, { color: colors.text }]}>
          {selectedDate.format('dddd, MMMM D, YYYY')}
        </Text>
        
        <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
          {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>
      
      {/* Tasks for selected day */}
      <FlatList
        data={selectedDayTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="calendar-blank" size={60} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tasks scheduled for this day
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('CreateTask')}
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: 'bold',
  },
  todayButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  monthYearText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
  },
  weekdayHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
  calendarGrid: {
    paddingHorizontal: SPACING.lg,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  notCurrentMonth: {
    opacity: 0.5,
  },
  selectedDay: {
    borderRadius: 8,
  },
  dayText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  taskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  selectedDayInfo: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  selectedDayText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  taskCountText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  taskList: {
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 30,
    marginTop: SPACING.lg,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: SPACING.xs,
  },
});

export default CalendarScreen; 