import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Replace with your own Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC-pSkKB6yV9IpZrHn1VBr21EtqEzgiO40",
    authDomain: "taskify-29b91.firebaseapp.com",
    projectId: "taskify-29b91",
    storageBucket: "taskify-29b91.appspot.com",
    messagingSenderId: "36784887484",
    appId: "1:36784887484:web:0f449e39d661c4d6a2a2b9",
    measurementId: "G-5W1CYFPG8Z"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously for demo purposes
export const signInAnon = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously: ", error);
    throw error;
  }
};

// Task collection reference
const tasksRef = collection(db, 'tasks');

// CRUD operations for tasks
export const createTaskInFirebase = async (task) => {
  try {
    await setDoc(doc(tasksRef, task.id), task);
    return task;
  } catch (error) {
    console.error("Error adding task: ", error);
    throw error;
  }
};

export const updateTaskInFirebase = async (id, updatedData) => {
  try {
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, updatedData);
    return { id, ...updatedData };
  } catch (error) {
    console.error("Error updating task: ", error);
    throw error;
  }
};

export const deleteTaskFromFirebase = async (id) => {
  try {
    await deleteDoc(doc(db, 'tasks', id));
    return id;
  } catch (error) {
    console.error("Error deleting task: ", error);
    throw error;
  }
};

export const fetchUserTasks = async (userId) => {
  try {
    const q = query(tasksRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push(doc.data());
    });
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks: ", error);
    throw error;
  }
};

// Real-time subscription to task updates
export const subscribeToTasks = (userId, callback) => {
  const q = query(tasksRef, where("userId", "==", userId));
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push(doc.data());
    });
    callback(tasks);
  }, (error) => {
    console.error("Error in task subscription: ", error);
  });
};

export { db, auth }; 