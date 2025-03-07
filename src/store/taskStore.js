import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';
import dayjs from 'dayjs';

// Define task statuses
export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

// Task priority levels
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

// Generate a unique ID for tasks
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// Helper to check if two dates are on the same day
const isSameDay = (date1, date2) => {
  return dayjs(date1).format('YYYY-MM-DD') === dayjs(date2).format('YYYY-MM-DD');
};

// Create task store with persistence
const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,
      error: null,
      
      // Actions for task management
      addTask: (taskData) => {
        const newTask = {
          id: generateId(),
          status: TASK_STATUS.TODO,
          priority: TASK_PRIORITY.MEDIUM,
          createdAt: new Date().toISOString(),
          ...taskData,
        };
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        
        return newTask;
      },
      
      updateTask: (id, updatedData) => {
        set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === id ? { ...task, ...updatedData } : task
          ),
        }));
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },
      
      // Update task status
      updateTaskStatus: (id, newStatus) => {
        set((state) => ({
          tasks: state.tasks.map((task) => 
            task.id === id ? { 
              ...task, 
              status: newStatus,
              completedAt: newStatus === TASK_STATUS.DONE ? new Date().toISOString() : task.completedAt,
            } : task
          ),
        }));
      },
      
      // Reorder tasks within the same status
      reorderTasks: (sourceIndex, destinationIndex, status) => {
        const tasks = get().tasks;
        const filteredTasks = tasks.filter(task => task.status === status);
        const [removed] = filteredTasks.splice(sourceIndex, 1);
        filteredTasks.splice(destinationIndex, 0, removed);
        
        // Map back to original array with new order
        const newTasks = tasks.map(task => {
          if (task.status !== status) return task;
          const newIdx = filteredTasks.findIndex(t => t.id === task.id);
          return filteredTasks[newIdx];
        });
        
        set({ tasks: newTasks });
      },
      
      // Move task between statuses (e.g., from TODO to IN_PROGRESS)
      moveTaskBetweenStatuses: (taskId, newStatus, newIndex) => {
        set((state) => {
          const taskToMove = state.tasks.find(task => task.id === taskId);
          if (!taskToMove) return state;
          
          // Get tasks with the new status
          const tasksInDestination = state.tasks.filter(task => task.status === newStatus);
          
          // Remove the task from its current status
          const tasksWithoutMoved = state.tasks.filter(task => task.id !== taskId);
          
          // Update the task with new status
          const updatedTask = { 
            ...taskToMove, 
            status: newStatus,
            completedAt: newStatus === TASK_STATUS.DONE ? new Date().toISOString() : taskToMove.completedAt,
          };
          
          // Insert the task at the correct position in the destination
          tasksInDestination.splice(newIndex, 0, updatedTask);
          
          // Combine all tasks
          const updatedTasks = [
            ...tasksWithoutMoved.filter(task => task.status !== newStatus),
            ...tasksInDestination
          ];
          
          return { tasks: updatedTasks };
        });
      },
      
      // Get tasks by status
      getTasksByStatus: (status) => {
        return get().tasks.filter(task => task.status === status);
      },
      
      // Get tasks for today
      getTodayTasks: () => {
        const today = new Date();
        return get().tasks.filter(task => {
          if (task.dueDate) {
            return isSameDay(today, new Date(task.dueDate));
          }
          return false;
        });
      },
      
      // Reset store state (clear all tasks)
      resetStore: () => {
        set({ tasks: [], isLoading: false, error: null });
      },
    }),
    {
      name: 'taskify-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

export default useTaskStore; 