import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  StatusBar,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  Layout, 
  SlideInRight,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS } from '../theme';
import TaskCard from '../components/TaskCard';
import useTaskStore, { TASK_STATUS } from '../store/taskStore';
import useSyncTasks from '../hooks/useSyncTasks';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const HomeScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const tasks = useTaskStore(state => state.tasks);
  const updateTaskStatus = useTaskStore(state => state.updateTaskStatus);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const { isSyncing, isOnline, forceSync, updateTaskAndSync, deleteTaskAndSync } = useSyncTasks();
  const [refreshing, setRefreshing] = useState(false);
  
  // State for filtered tasks
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);
  
  // Filter options
  const filters = [
    { id: 'all', label: 'All', icon: 'format-list-bulleted' },
    { id: 'today', label: 'Today', icon: 'calendar-today' },
    { id: 'upcoming', label: 'Upcoming', icon: 'calendar-clock' },
    { id: 'completed', label: 'Completed', icon: 'check-circle-outline' },
  ];
  
  // Filter tasks based on active filter
  useEffect(() => {
    let filtered = [];
    const today = dayjs().startOf('day');
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const nextWeek = dayjs().add(7, 'day').startOf('day');
    
    switch (activeFilter) {
      case 'today':
        filtered = tasks.filter(task => 
          task.status !== TASK_STATUS.DONE && 
          task.dueDate && 
          dayjs(task.dueDate).isSame(today, 'day')
        );
        break;
      case 'upcoming':
        filtered = tasks.filter(task => 
          task.status !== TASK_STATUS.DONE && 
          task.dueDate && 
          dayjs(task.dueDate).isAfter(today) && 
          dayjs(task.dueDate).isBefore(nextWeek)
        );
        break;
      case 'completed':
        filtered = tasks.filter(task => task.status === TASK_STATUS.DONE);
        break;
      default: // 'all'
        filtered = tasks.filter(task => task.status !== TASK_STATUS.DONE);
        break;
    }
    
    // Sort by due date (if available) and then by creation date
    filtered.sort((a, b) => {
      // If both have due dates, sort by due date
      if (a.dueDate && b.dueDate) {
        return dayjs(a.dueDate).diff(dayjs(b.dueDate));
      }
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // If no due dates or equal due dates, sort by created date
      return dayjs(b.createdAt).diff(dayjs(a.createdAt));
    });
    
    setFilteredTasks(filtered);
  }, [tasks, activeFilter]);
  
  // Handle complete task
  const handleCompleteTask = (taskId) => {
    updateTaskAndSync(taskId, { 
      status: TASK_STATUS.DONE,
      completedAt: new Date().toISOString(),
    });
  };
  
  // Handle delete task
  const handleDeleteTask = (taskId) => {
    deleteTaskAndSync(taskId);
  };
  
  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await forceSync();
    setRefreshing(false);
  };
  
  // Render task item
  const renderTaskItem = ({ item }) => (
    <Animated.View
      entering={FadeIn.duration(300).delay(100 * Math.random())}
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
  
  // Render filter item
  const renderFilterItem = ({ item }) => (
    <AnimatedTouchableOpacity
      entering={SlideInRight.delay(100 * Math.random()).duration(300)}
      style={[
        styles.filterButton,
        activeFilter === item.id && styles.filterButtonActive,
        {
          backgroundColor: activeFilter === item.id 
            ? colors.primary + '20' 
            : colors.cardElevated,
          borderColor: activeFilter === item.id 
            ? colors.primary 
            : colors.border,
        }
      ]}
      onPress={() => setActiveFilter(item.id)}
    >
      <Icon
        name={item.icon}
        size={18}
        color={activeFilter === item.id ? colors.primary : colors.textSecondary}
        style={styles.filterIcon}
      />
      <Text
        style={[
          styles.filterText,
          {
            color: activeFilter === item.id 
              ? colors.primary 
              : colors.textSecondary,
          }
        ]}
      >
        {item.label}
      </Text>
    </AnimatedTouchableOpacity>
  );
  
  // Calculate today's date string
  const todayDate = dayjs().format('ddd, MMM D');
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {todayDate}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My Tasks
          </Text>
        </View>
        
        {/* Sync indicator */}
        <View style={styles.syncContainer}>
          <TouchableOpacity
            onPress={forceSync}
            disabled={isSyncing}
            style={[
              styles.syncButton,
              { backgroundColor: colors.cardElevated },
              SHADOWS.light,
            ]}
          >
            <Icon
              name={isSyncing ? 'sync' : isOnline ? 'cloud-check' : 'cloud-off-outline'}
              size={20}
              color={
                isSyncing 
                  ? colors.primary 
                  : isOnline 
                    ? colors.success 
                    : colors.warning
              }
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Filters */}
      <FlatList
        horizontal
        data={filters}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      />
      
      {/* Tasks list */}
      <AnimatedFlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name={
                activeFilter === 'completed' 
                  ? 'check-circle-outline' 
                  : activeFilter === 'today' 
                    ? 'calendar-today'
                    : 'format-list-bulleted'
              }
              size={80}
              color={colors.textMuted}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeFilter === 'completed'
                ? "You haven't completed any tasks yet"
                : activeFilter === 'today'
                  ? "No tasks due today"
                  : "No tasks found"}
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
  dateText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: 'bold',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 20,
    marginRight: SPACING.md,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: SPACING.xs,
  },
  filterText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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

export default HomeScreen; 