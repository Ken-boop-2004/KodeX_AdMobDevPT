import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

import { CapturedPokemon, CollectionsSummary, Hunt, MapSession, Spawn } from '../types/firestore';
import { UserPreferences, UserProfile, UserStats } from '../types/user';

const USERS = 'users';
const CAPTURED = 'capturedPokemon';
const HUNTS = 'hunts';
const SPAWNS = 'spawns';
const MAP_SESSIONS = 'mapsessions';
const COLLECTIONS = 'collections';

export const serverTimestamp = firestore.FieldValue.serverTimestamp as () => FirebaseFirestoreTypes.Timestamp;
const increment = firestore.FieldValue.increment;

export const getUserDoc = (uid: string) => firestore().collection<UserProfile>(USERS).doc(uid);

export const getCapturedCollection = (uid: string) =>
  getUserDoc(uid).collection<CapturedPokemon>(CAPTURED);

export const getHuntDoc = (huntId: string) => firestore().collection<Hunt>(HUNTS).doc(huntId);

export const getSpawnsCollection = (huntId: string) =>
  getHuntDoc(huntId).collection<Spawn>(SPAWNS);

export const getMapSessionDoc = (sessionId: string) =>
  firestore().collection<MapSession>(MAP_SESSIONS).doc(sessionId);

export const getCollectionsSummaryDoc = (uid: string) =>
  firestore().collection<CollectionsSummary>(COLLECTIONS).doc(uid);

export const createOrUpdateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
  merge = true,
) => {
  const docRef = getUserDoc(uid);
  await docRef.set(
    {
      ...data,
      updatedAt: serverTimestamp(),
    } as Partial<UserProfile>,
    { merge },
  );
};

export const updateUserPreferences = async (uid: string, preferences: Partial<UserPreferences>) => {
  await createOrUpdateUserProfile(uid, { preferences } as Partial<UserProfile>);
};

export const updateUserStats = async (uid: string, stats: Partial<UserStats>) => {
  await createOrUpdateUserProfile(uid, { stats } as Partial<UserProfile>);
};

export const addCapturedPokemon = async (uid: string, capture: CapturedPokemon) => {
  const collectionRef = getCapturedCollection(uid);
  await collectionRef.add({
    ...capture,
    capturedAt: capture.capturedAt ?? serverTimestamp(),
  });
};

export const incrementCaptureCount = async (uid: string) => {
  const docRef = getUserDoc(uid);
  await docRef.set(
    {
      totalCaptures: increment(1) as unknown as number,
      updatedAt: serverTimestamp(),
    } as Partial<UserProfile>,
    { merge: true },
  );
};

export const toggleFavoriteTag = async (uid: string, pokemonId: string, favorite: boolean) => {
  const docRef = getCapturedCollection(uid).doc(pokemonId);
  const tagValue = favorite ? firestore.FieldValue.arrayUnion('favorite') : firestore.FieldValue.arrayRemove('favorite');
  await docRef.set(
    {
      tags: tagValue as unknown as string[],
    },
    { merge: true },
  );
};

export const upsertCollectionsSummary = async (uid: string, summary: Partial<CollectionsSummary>) => {
  const docRef = getCollectionsSummaryDoc(uid);
  await docRef.set(summary, { merge: true });
};

