import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Habit, HabitLog, MoodLog, SkipLog, HabitIcon } from '../store/useKineticStore';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Retry exhausted');
}

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
  return withRetry(async () => {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { ...updates, lastSyncedAt: new Date().toISOString() }, { merge: true });
  });
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

const BATCH_CHUNK_SIZE = 450;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export interface BatchUpsertResult {
  succeeded: number;
  failed: number;
}

// Batch upsert helper for debounced sync (chunks to avoid Firestore 500-op limit)
export const batchUpsert = async <T extends { id: string }>(
  userId: string,
  collectionName: string,
  items: T[]
): Promise<BatchUpsertResult> => {
  if (items.length === 0) return { succeeded: 0, failed: 0 };

  const chunks = chunkArray(items, BATCH_CHUNK_SIZE);
  let succeeded = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      await withRetry(async () => {
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          const docRef = doc(db, 'users', userId, collectionName, item.id);
          batch.set(docRef, item, { merge: true });
        });
        await batch.commit();
      });
      succeeded += chunk.length;
    } catch (error) {
      console.error(`Firestore batchUpsert failed for ${collectionName}:`, error);
      failed += chunk.length;
    }
  }

  return { succeeded, failed };
};

// Specialized Fetchers
export const deleteAllUserData = async (userId: string): Promise<void> => {
  const collections = ['habits', 'habit_logs', 'mood_logs', 'skip_logs'] as const;
  for (const collName of collections) {
    const collRef = getCollectionRef(userId, collName);
    const snapshot = await getDocs(collRef);
    const chunks = chunkArray(snapshot.docs, BATCH_CHUNK_SIZE);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  const userDocRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    await deleteDoc(userDocRef);
  }
};

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
