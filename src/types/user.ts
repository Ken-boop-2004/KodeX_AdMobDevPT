import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type UserPreferences = {
  units: 'metric' | 'imperial';
  notifications: boolean;
  mapStyle: string;
};

export type UserStats = {
  totalCaught: number;
  lastHuntAt?: FirebaseFirestoreTypes.Timestamp | null;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  preferences: UserPreferences;
  stats: UserStats;
  totalCaptures?: number;
  createdAt?: FirebaseFirestoreTypes.Timestamp | null;
  updatedAt?: FirebaseFirestoreTypes.Timestamp | null;
};

export type SignUpFormValues = {
  displayName: string;
  email: string;
  password: string;
};

