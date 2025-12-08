import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type CapturedPokemon = {
  pokemonId: number;
  pokemonName: string;
  capturedAt: FirebaseFirestoreTypes.Timestamp;
  location: GeoPoint;
  level: number;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  spriteUrl?: string;
  source?: 'hunt' | 'event' | 'trade';
  tags?: string[];
};

export type Hunt = {
  ownerUid: string;
  startedAt: FirebaseFirestoreTypes.Timestamp;
  endedAt?: FirebaseFirestoreTypes.Timestamp | null;
  region: { lat: number; lng: number; radius: number };
  biome: string;
  status: 'active' | 'ended';
  participants?: string[];
};

export type Spawn = {
  pokemonId: string;
  name: string;
  spawnAt: FirebaseFirestoreTypes.Timestamp;
  despawnAt: FirebaseFirestoreTypes.Timestamp;
  location: { lat: number; lng: number };
  rarity: string;
  caughtBy?: string | null;
};

export type MapSession = {
  ownerUid: string;
  startedAt: FirebaseFirestoreTypes.Timestamp;
  lastUpdateAt: FirebaseFirestoreTypes.Timestamp;
  location: GeoPoint;
};

export type CollectionsSummary = {
  countsByType?: Record<string, number>;
  latestCaught?: { pokemonId: string; name: string; caughtAt: FirebaseFirestoreTypes.Timestamp };
  favorites?: string[];
};

