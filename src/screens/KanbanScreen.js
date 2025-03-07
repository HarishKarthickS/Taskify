import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  FadeIn, 
  FadeOut, 
  Layout, 
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../theme/ThemeContext';
import { SPACING, TYPOGRAPHY, SHADOWS, SCREEN_WIDTH } from '../theme';
import TaskCard from '../components/TaskCard';
import useTaskStore, { TASK_STATUS } from '../store/taskStore';
import useSyncTasks from '../hooks/useSyncTasks';

const COLUMN_WIDTH = (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md * 2) / 3;

const KanbanScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const tasks = useTaskStore(state => state.tasks);
  const moveTaskBetweenStatuses = useTaskStore(state => state.moveTaskBetweenStatuses);
  const { updateTaskAndSync } = useSyncTasks();
  
  // Refs to track each column's position
  const todoColumnRef = useRef(null);
  const inProgressColumnRef = useRef(null);
  const doneColumnRef = useRef(null);
  
  // Store column positions
  const [columnPositions, setColumnPositions] = useState({
    [TASK_STATUS.TODO]: { x: 0, y: 0, width: 0, height: 0 },
    [TASK_STATUS.IN_PROGRESS]: { x: 0, y: 0, width: 0, height: 0 },
    [TASK_STATUS.DONE]: { x: 0, y: 0, width: 0, height: 0 },
  });
  
  // Track when a task is being dragged
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  
  // Grouped tasks
  const [todoTasks, setTodoTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [doneTasks, setDoneTasks] = useState([]);
  
  // Update tasks when store changes
  useEffect(() => {
    setTodoTasks(tasks.filter(task => task.status === TASK_STATUS.TODO));
    setInProgressTasks(tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS));
    setDoneTasks(tasks.filter(task => task.status === TASK_STATUS.DONE));
  }, [tasks]);
  
  // Function to measure column positions
  const measureColumns = () => {
    todoColumnRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setColumnPositions(prev => ({
        ...prev,
        [TASK_STATUS.TODO]: { x: pageX, y: pageY, width, height },
      }));
    });
    
    inProgressColumnRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setColumnPositions(prev => ({
        ...prev,
        [TASK_STATUS.IN_PROGRESS]: { x: pageX, y: pageY, width, height },
      }));
    });
    
    doneColumnRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setColumnPositions(prev => ({
        ...prev,
        [TASK_STATUS.DONE]: { x: pageX, y: pageY, width, height },
      }));
    });
  };
  
  // Measure columns after layout
  useEffect(() => {
    // Use a timeout to ensure the layout is complete
    const timer = setTimeout(() => {
      measureColumns();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle drag start
  const handleDragStart = (task) => {
    setIsDragging(true);
    setDraggedTask(task);
  };
  
  // Handle drag end
  const handleDragEnd = (info) => {
    setIsDragging(false);
    
    if (!draggedTask) return;
    
    // Determine which column the task was dropped in
    const { x, y } = info;
    let targetStatus = null;
    let dropIndex = 0;
    
    // Check if task was dropped in a column
    for (const status in columnPositions) {
      const col = columnPositions[status];
      if (
        x >= col.x && 
        x <= col.x + col.width && 
        y >= col.y && 
        y <= col.y + col.height
      ) {
        targetStatus = status;
        
        // Calculate drop index based on y position within column
        const tasksInColumn = tasks.filter(t => t.status === status);
        // Simple approach - just add to the end
        dropIndex = tasksInColumn.length;
        break;
      }
    }
    
    // If a valid column was found and it's different from the task's current status
    if (targetStatus && targetStatus !== draggedTask.status) {
      updateTaskAndSync(draggedTask.id, { 
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        completedAt: targetStatus === TASK_STATUS.DONE ? new Date().toISOString() : undefined,
      });
      
      // Use Zustand move function to handle reordering
      moveTaskBetweenStatuses(draggedTask.id, targetStatus, dropIndex);
    }
    
    setDraggedTask(null);
  };
  
  // Render a kanban column
  const renderColumn = (title, tasks, status, columnRef) => (
    <View 
      style={[styles.column, { backgroundColor: colors.card }]} 
      ref={columnRef}
      onLayout={() => measureColumns()}
    >
      <View style={styles.columnHeader}>
        <Text style={[styles.columnTitle, { color: colors.text }]}>
          {title}
        </Text>
        <View style={[styles.taskCount, { backgroundColor: colors.cardElevated }]}>
          <Text style={[styles.taskCountText, { color: colors.textSecondary }]}>
            {tasks.length}
          </Text>
        </View>
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.columnScroll}
        contentContainerStyle={styles.columnContent}
      >
        {tasks.map((task) => (
          <Animated.View
            key={task.id}
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
          >
            <TaskCard
              task={task}
              isKanban={true}
              onDragStart={() => handleDragStart(task)}
              onDragEnd={handleDragEnd}
              enabled={!isDragging || draggedTask?.id === task.id}
            />
          </Animated.View>
        ))}
        
        {/* Empty state */}
        {tasks.length === 0 && (
          <View style={styles.emptyColumn}>
            <Icon 
              name={
                status === TASK_STATUS.TODO 
                  ? 'format-list-bulleted' 
                  : status === TASK_STATUS.IN_PROGRESS 
                    ? 'progress-clock' 
                    : 'check-circle-outline'
              } 
              size={40} 
              color={colors.textMuted} 
            />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {status === TASK_STATUS.TODO 
                ? 'No tasks to do' 
                : status === TASK_STATUS.IN_PROGRESS 
                  ? 'No tasks in progress' 
                  : 'No completed tasks'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.background}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Kanban Board
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('CreateTask')}
        >
          <Icon name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.kanbanContainer}>
        {renderColumn('To Do', todoTasks, TASK_STATUS.TODO, todoColumnRef)}
        {renderColumn('In Progress', inProgressTasks, TASK_STATUS.IN_PROGRESS, inProgressColumnRef)}
        {renderColumn('Done', doneTasks, TASK_STATUS.DONE, doneColumnRef)}
      </View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  kanbanContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    flex: 1,
  },
  column: {
    width: COLUMN_WIDTH,
    borderRadius: 12,
    marginRight: SPACING.md,
    ...SHADOWS.light,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  columnTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
  },
  taskCount: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
  },
  columnScroll: {
    flex: 1,
  },
  columnContent: {
    padding: SPACING.sm,
    paddingBottom: SPACING.xxl,
  },
  emptyColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});

export default KanbanScreen; 