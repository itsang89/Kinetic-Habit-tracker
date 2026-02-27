import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  Timestamp,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitLog, MoodLog, SkipLog, HabitIcon } from '../store/useKineticStore';

// User profile interface matching existing store fields
export interface UserProfile {
  userName: string;
  userIcon: HabitIcon;
  weeklyContractTarget: number | null;
  momentumScore: number;
  lastDecayDate: string | null;
  previousWeekMomentum: number;
  lastSyncedAt: string | null;
}

// Helper to get collection reference
const getCollectionRef = (userId: string, collectionName: string) => 
  collection(db, 'users', userId, collectionName);

// Profile
export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, { ...updates, lastSyncedAt: new Date().toISOString() }, { merge: true });
};

// Generic CRUD helpers for sub-collections
export const getSubCollectionData = async <T extends { id: string, deletedAt?: string }>(
  userId: string, 
  collectionName: string,
  includeDeleted = false
): Promise<T[]> => {
  const collRef = getCollectionRef(userId, collectionName);
  
  // We fetch all items and filter in memory for 'deletedAt'.
  // Firestore queries for "field == null" only return documents where the field
  // explicitly exists and is null. Documents missing the field are excluded.
  const querySnapshot = await getDocs(collRef);
  const data: T[] = [];
  querySnapshot.forEach((doc) => {
    data.push(doc.data() as T);
  });
  
  if (!includeDeleted) {
    return data.filter(item => !item.deletedAt);
  }
  
  return data;
};

export const upsertSubCollectionItem = async <T extends { id: string }>(
  userId: string,
  collectionName: string,
  item: T
) => {
  const docRef = doc(db, 'users', userId, collectionName, item.id);
  await setDoc(docRef, item, { merge: true });
};

export const deleteSubCollectionItem = async (
  userId: string,
  collectionName: string,
  itemId: string
) => {
  const docRef = doc(db, 'users', userId, collectionName, itemId);
  await updateDoc(docRef, { deletedAt: new Date().toISOString() });
};

// Batch upsert helper for debounced sync
export const batchUpsert = async <T extends { id: string }>(
  userId: string,
  collectionName: string,
  items: T[]
) => {
  if (items.length === 0) return;
  
  const batch = writeBatch(db);
  items.forEach((item) => {
    const docRef = doc(db, 'users', userId, collectionName, item.id);
    batch.set(docRef, item, { merge: true });
  });
  await batch.commit();
};

// Specialized Fetchers
export const getAllUserData = async (userId: string) => {
  const [profile, habits, habitLogs, moodLogs, skipLogs] = await Promise.all([
    getProfile(userId),
    getSubCollectionData<Habit>(userId, 'habits'),
    getSubCollectionData<HabitLog>(userId, 'habit_logs'),
    getSubCollectionData<MoodLog>(userId, 'mood_logs'),
    getSubCollectionData<SkipLog>(userId, 'skip_logs'),
  ]);

  return {
    profile,
    habits,
    habitLogs,
    moodLogs,
    skipLogs,
  };
};
