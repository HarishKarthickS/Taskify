import { useEffect, useState } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import useTaskStore from '../store/taskStore';
import { auth, subscribeToTasks, createTaskInFirebase, updateTaskInFirebase, deleteTaskFromFirebase, fetchUserTasks, signInAnon } from '../config/firebase';

/**
 * Hook to synchronize tasks between Firebase and local storage
 * Handles online/offline mode seamlessly
 */
const useSyncTasks = () => {
  const netInfo = useNetInfo();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get tasks and actions from the store
  const tasks = useTaskStore(state => state.tasks);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const resetStore = useTaskStore(state => state.resetStore);
  
  // Initialize sync when the app starts
  useEffect(() => {
    // Delay initialization slightly to ensure NetInfo is ready
    const initializeTimeout = setTimeout(() => {
      const initialize = async () => {
        try {
          // Sign in anonymously if not authenticated
          if (!auth.currentUser) {
            await signInAnon();
          }
          
          // Only sync if online - with safeguard against netInfo not being ready
          if (netInfo && netInfo.isConnected === true) {
            await syncTasksWithFirebase();
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing sync:', error);
          setSyncError(error.message);
          // Set initialized anyway to prevent getting stuck
          setIsInitialized(true);
        }
      };
      
      initialize();
    }, 500); // Small delay to ensure NetInfo is ready
    
    return () => clearTimeout(initializeTimeout);
  }, []);
  
  // Watch for network status changes - with netInfo ready check
  useEffect(() => {
    if (isInitialized && netInfo && netInfo.isConnected === true && !isSyncing) {
      syncTasksWithFirebase();
    }
  }, [netInfo.isConnected, isInitialized]);
  
  // Subscribe to remote changes when online
  useEffect(() => {
    let unsubscribe = null;
    
    const subscribeToRemoteChanges = async () => {
      if (auth.currentUser && netInfo.isConnected) {
        unsubscribe = subscribeToTasks(auth.currentUser.uid, (remoteTasks) => {
          // We'll handle the sync logic in a separate function
          handleRemoteTaskChanges(remoteTasks);
        });
      }
    };
    
    if (isInitialized) {
      subscribeToRemoteChanges();
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isInitialized, netInfo.isConnected]);
  
  // Handle remote task changes
  const handleRemoteTaskChanges = (remoteTasks) => {
    // This function handles changes coming from Firebase
    // Only update local tasks when needed to avoid infinite loops
    
    // Implement merge logic here: Compare remote and local tasks
    // and update local store only when necessary
    
    // For simplicity, let's just update the local store if there are differences
    const localTaskIds = new Set(tasks.map(task => task.id));
    const remoteTaskIds = new Set(remoteTasks.map(task => task.id));
    
    // Find tasks that exist remotely but not locally
    const tasksToAdd = remoteTasks.filter(task => !localTaskIds.has(task.id));
    
    // Find tasks that exist locally but not remotely
    const tasksToRemove = tasks.filter(task => !remoteTaskIds.has(task.id));
    
    // Find tasks that exist in both and may need updates
    const tasksToUpdate = remoteTasks.filter(remoteTask => {
      const localTask = tasks.find(task => task.id === remoteTask.id);
      
      // Compare timestamps or version numbers to see if remote is newer
      if (localTask) {
        const remoteUpdatedAt = remoteTask.updatedAt ? new Date(remoteTask.updatedAt) : new Date(0);
        const localUpdatedAt = localTask.updatedAt ? new Date(localTask.updatedAt) : new Date(0);
        return remoteUpdatedAt > localUpdatedAt;
      }
      
      return false;
    });
    
    // Apply changes to local store
    tasksToAdd.forEach(task => addTask(task));
    tasksToRemove.forEach(task => deleteTask(task.id));
    tasksToUpdate.forEach(task => updateTask(task.id, task));
  };
  
  // Sync tasks with Firebase
  const syncTasksWithFirebase = async () => {
    if (!auth.currentUser || isSyncing) return;
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      // Get remote tasks
      const remoteTasks = await fetchUserTasks(auth.currentUser.uid);
      
      // Apply the merge logic
      await mergeTasksWithRemote(remoteTasks);
      
      setLastSynced(new Date());
    } catch (error) {
      console.error('Error syncing tasks:', error);
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Merge local tasks with remote tasks
  const mergeTasksWithRemote = async (remoteTasks) => {
    // For each local task, check if it exists remotely
    for (const localTask of tasks) {
      const remoteTask = remoteTasks.find(task => task.id === localTask.id);
      
      // If task doesn't exist remotely, create it
      if (!remoteTask) {
        // Add user ID before saving to Firebase
        const taskWithUserId = { 
          ...localTask, 
          userId: auth.currentUser.uid,
          updatedAt: new Date().toISOString() 
        };
        await createTaskInFirebase(taskWithUserId);
      } 
      // If task exists remotely, but local version is newer, update remote
      else if (localTask.updatedAt && remoteTask.updatedAt && new Date(localTask.updatedAt) > new Date(remoteTask.updatedAt)) {
        const updatedTask = { 
          ...localTask, 
          userId: auth.currentUser.uid,
          updatedAt: new Date().toISOString() 
        };
        await updateTaskInFirebase(localTask.id, updatedTask);
      }
    }
    
    // For each remote task, check if it exists locally
    for (const remoteTask of remoteTasks) {
      const localTask = tasks.find(task => task.id === remoteTask.id);
      
      // If remote task doesn't exist locally, add it
      if (!localTask) {
        addTask(remoteTask);
      } 
      // If remote task is newer than local, update local
      else if (remoteTask.updatedAt && (!localTask.updatedAt || new Date(remoteTask.updatedAt) > new Date(localTask.updatedAt))) {
        updateTask(remoteTask.id, remoteTask);
      }
    }
  };
  
  // Force sync with Firebase
  const forceSync = async () => {
    if (netInfo.isConnected) {
      await syncTasksWithFirebase();
    } else {
      setSyncError('No internet connection available');
    }
  };
  
  // Create a task and sync with Firebase if online
  const createTask = async (taskData) => {
    // Add to local store first
    const newTask = addTask({
      ...taskData,
      updatedAt: new Date().toISOString(),
    });
    
    // If online, sync with Firebase
    if (netInfo.isConnected && auth.currentUser) {
      try {
        const taskWithUserId = { 
          ...newTask, 
          userId: auth.currentUser.uid 
        };
        await createTaskInFirebase(taskWithUserId);
      } catch (error) {
        console.error('Error creating task in Firebase:', error);
      }
    }
    
    return newTask;
  };
  
  // Update a task and sync with Firebase if online
  const updateTaskAndSync = async (id, updatedData) => {
    // Update local store first
    updateTask(id, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    
    // If online, sync with Firebase
    if (netInfo.isConnected && auth.currentUser) {
      try {
        await updateTaskInFirebase(id, {
          ...updatedData,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating task in Firebase:', error);
      }
    }
  };
  
  // Delete a task and sync with Firebase if online
  const deleteTaskAndSync = async (id) => {
    // Delete from local store first
    deleteTask(id);
    
    // If online, sync with Firebase
    if (netInfo.isConnected && auth.currentUser) {
      try {
        await deleteTaskFromFirebase(id);
      } catch (error) {
        console.error('Error deleting task from Firebase:', error);
      }
    }
  };
  
  return {
    isSyncing,
    syncError,
    lastSynced,
    isOnline: netInfo.isConnected,
    forceSync,
    createTask,
    updateTaskAndSync,
    deleteTaskAndSync,
  };
};

export default useSyncTasks; 