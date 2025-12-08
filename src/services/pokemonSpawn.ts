import { Location } from './geolocation';
import { PokemonDetail } from '../types/pokemon';

export type SpawnedPokemon = {
  pokemon: PokemonDetail;
  location: Location;
  spawnTime: number;
  id: string;
};

export const MIN_DISTANCE_METERS = 5;
export const MAX_DISTANCE_METERS = 15;
export const MIN_SPAWNS = 5;
export const MAX_SPAWNS = 15;
const SPAWN_COOLDOWN_MS = 1000; // effectively no cooldown; kept for sanity
const DESPAWN_AGE_MS = 30 * 60 * 1000; // 30 minutes

// Cache of spawned Pokémon
let spawnedPokemon: SpawnedPokemon[] = [];
let lastSpawnTime = 0;
let spawnCounter = 0;

// Simple pool of Pokémon IDs (no rarity)
const SIMPLE_POKEMON_IDS = [
  1, 4, 7, 10, 13, 16, 19, 21, 23, 25, 27, 29, 32, 35, 37, 39, 41, 43, 46, 48,
  50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 74, 77, 79, 81, 84, 86, 88, 90, 92, 95,
];

const cleanupExpired = () => {
  const cutoff = Date.now() - DESPAWN_AGE_MS;
  spawnedPokemon = spawnedPokemon.filter((spawn) => spawn.spawnTime > cutoff);
};

const buildPokemonDetail = (id: number): PokemonDetail => {
  const nameMap: Record<number, string> = {
    1: 'bulbasaur',
    4: 'charmander',
    7: 'squirtle',
    10: 'caterpie',
    13: 'weedle',
    16: 'pidgey',
    19: 'rattata',
    21: 'spearow',
    23: 'ekans',
    25: 'pikachu',
    27: 'sandshrew',
    29: 'nidoran-f',
    32: 'nidoran-m',
    35: 'clefairy',
    37: 'vulpix',
    39: 'jigglypuff',
    41: 'zubat',
    43: 'oddish',
    46: 'paras',
    48: 'venonat',
    50: 'diglett',
    52: 'meowth',
    54: 'psyduck',
    56: 'mankey',
    58: 'growlithe',
    60: 'poliwag',
    63: 'abra',
    66: 'machop',
    69: 'bellsprout',
    72: 'tentacool',
    74: 'geodude',
    77: 'ponyta',
    79: 'slowpoke',
    81: 'magnemite',
    84: 'doduo',
    86: 'seel',
    88: 'grimer',
    90: 'shellder',
    92: 'gastly',
    95: 'onix',
  };
  const name = nameMap[id] || `pokemon-${id}`;
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  return {
    id,
    name,
    sprites: { front_default: spriteUrl },
    stats: [
      { base_stat: 50, stat: { name: 'hp', url: '' } },
      { base_stat: 50, stat: { name: 'attack', url: '' } },
      { base_stat: 50, stat: { name: 'defense', url: '' } },
      { base_stat: 50, stat: { name: 'speed', url: '' } },
    ],
    types: [],
    height: 1,
    weight: 1,
    base_experience: 0,
    abilities: [],
    moves: [],
    order: id,
    species: { name, url: '' },
  };
};

// Generate a random offset from the user's location
const generateRandomOffset = (): { lat: number; lng: number } => {
  // pick random distance between MIN and MAX meters
  const distanceMeters =
    MIN_DISTANCE_METERS + Math.random() * (MAX_DISTANCE_METERS - MIN_DISTANCE_METERS);
  const radiusDegrees = distanceMeters / 111000; // 1 degree ≈ 111km

  // Random angle
  const angle = Math.random() * 2 * Math.PI;

  // Random distance within radius
  const distance = Math.random() * radiusDegrees;

  return {
    lat: Math.cos(angle) * distance,
    lng: Math.sin(angle) * distance,
  };
};

type SpawnOptions = { ignoreCooldown?: boolean };

export const spawnPokemonNearby = async (
  userLocation: Location,
  options: SpawnOptions = {},
): Promise<SpawnedPokemon | null> => {
  const now = Date.now();
  const { ignoreCooldown = false } = options;

  cleanupExpired();

  // Check cooldown
  if (!ignoreCooldown && now - lastSpawnTime < SPAWN_COOLDOWN_MS) {
    return null;
  }

  // Check max spawns
  if (spawnedPokemon.length >= MAX_SPAWNS) {
    return null;
  }

  // Pick a random Pokémon id from pool
  const pokemonId =
    SIMPLE_POKEMON_IDS[Math.floor(Math.random() * SIMPLE_POKEMON_IDS.length)];
  const pokemon = buildPokemonDetail(pokemonId);

  // Generate spawn location near user
  const offset = generateRandomOffset();
  const spawnLocation: Location = {
    latitude: userLocation.latitude + offset.lat,
    longitude: userLocation.longitude + offset.lng,
  };

  const spawned: SpawnedPokemon = {
    pokemon,
    location: spawnLocation,
    spawnTime: now,
    id: `${pokemon.id}-${now}-${++spawnCounter}`,
  };

  spawnedPokemon.push(spawned);
  lastSpawnTime = now;

  return spawned;
};

export const spawnPokemonBatch = async (
  userLocation: Location,
  desiredCount?: number,
): Promise<SpawnedPokemon[]> => {
  cleanupExpired();
  const target =
    desiredCount ??
    MIN_SPAWNS + Math.floor(Math.random() * (MAX_SPAWNS - MIN_SPAWNS + 1));

  const newSpawns: SpawnedPokemon[] = [];
  while (spawnedPokemon.length + newSpawns.length < target) {
    const spawned = await spawnPokemonNearby(userLocation, { ignoreCooldown: true });
    if (!spawned) break;
    newSpawns.push(spawned);
  }

  return newSpawns;
};

export const getActiveSpawns = (): SpawnedPokemon[] => {
  cleanupExpired();
  return [...spawnedPokemon];
};

export const getNearbySpawns = (userLocation: Location, radiusMeters: number = 200): SpawnedPokemon[] => {
  return spawnedPokemon.filter((spawn) => {
    const distance = calculateDistanceMeters(userLocation, spawn.location);
    return distance <= radiusMeters;
  });
};

export const removeSpawn = (spawnId: string): void => {
  spawnedPokemon = spawnedPokemon.filter((spawn) => spawn.id !== spawnId);
};

export const clearAllSpawns = (): void => {
  spawnedPokemon = [];
  lastSpawnTime = 0;
};

// Calculate distance between two locations in meters (Haversine formula)
export const calculateDistanceMeters = (loc1: Location, loc2: Location): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.latitude * Math.PI) / 180) *
      Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

