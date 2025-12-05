import firestore from '@react-native-firebase/firestore';
import { PokemonDetail } from '../types/pokemon';

export type CaughtPokemon = {
  id: string;
  trainerId: string;
  pokemonId: number;
  pokemonName: string;
  pokemonData: PokemonDetail;
  caughtAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  biome?: string;
};

const caughtPokemonCollection = firestore().collection('pokemon_caught');
const trainersCollection = firestore().collection('trainers');

/**
 * Save a caught Pokemon to Firestore and update trainer's caughtCount
 */
export const saveCaughtPokemon = async (
  trainerId: string,
  pokemon: PokemonDetail,
  location?: { latitude: number; longitude: number },
  biome?: string,
): Promise<string> => {
  const caughtPokemon: Omit<CaughtPokemon, 'id'> = {
    trainerId,
    pokemonId: pokemon.id,
    pokemonName: pokemon.name,
    pokemonData: pokemon,
    caughtAt: new Date(),
    location,
    biome,
  };

  // Save to pokemon_caught collection
  const docRef = await caughtPokemonCollection.add(caughtPokemon);

  // Increment trainer's caughtCount
  await trainersCollection.doc(trainerId).update({
    caughtCount: firestore.FieldValue.increment(1),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return docRef.id;
};

/**
 * Get all Pokemon caught by a trainer
 */
export const getCaughtPokemon = async (trainerId: string): Promise<CaughtPokemon[]> => {
  const snapshot = await caughtPokemonCollection
    .where('trainerId', '==', trainerId)
    .orderBy('caughtAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    caughtAt: doc.data().caughtAt.toDate(),
  })) as CaughtPokemon[];
};

/**
 * Get count of caught Pokemon by trainer
 */
export const getCaughtCount = async (trainerId: string): Promise<number> => {
  const snapshot = await caughtPokemonCollection
    .where('trainerId', '==', trainerId)
    .get();

  return snapshot.size;
};

/**
 * Check if trainer has caught a specific Pokemon
 */
export const hasCaughtPokemon = async (
  trainerId: string,
  pokemonId: number,
): Promise<boolean> => {
  const snapshot = await caughtPokemonCollection
    .where('trainerId', '==', trainerId)
    .where('pokemonId', '==', pokemonId)
    .limit(1)
    .get();

  return !snapshot.empty;
};
