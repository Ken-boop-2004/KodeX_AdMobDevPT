import { CapturedPokemon } from '../types/firestore';
import { PokemonDetail } from '../types/pokemon';
import { Location } from './geolocation';
import { addCapturedPokemon, incrementCaptureCount, serverTimestamp } from './database';
import { SpawnedPokemon } from './pokemonSpawn';

const getStat = (pokemon: PokemonDetail, key: 'hp' | 'attack' | 'defense' | 'speed'): number => {
  const stat = pokemon.stats?.find((s) => s.stat.name === key || s.stat.name === mapKey(key));
  return stat?.base_stat ?? Math.floor(Math.random() * 30) + 20; // fallback baseline
};

const mapKey = (key: 'hp' | 'attack' | 'defense' | 'speed') => {
  if (key === 'hp') return 'hp';
  if (key === 'attack') return 'attack';
  if (key === 'defense') return 'defense';
  return 'speed';
};

const randomLevel = () => Math.floor(Math.random() * 20) + 1; // 1 - 20

const buildCapturePayload = (
  spawn: SpawnedPokemon,
  playerLocation: Location,
): CapturedPokemon => ({
  pokemonId: spawn.pokemon.id,
  pokemonName: spawn.pokemon.name,
  capturedAt: serverTimestamp(),
  location: {
    lat: playerLocation.latitude,
    lng: playerLocation.longitude,
    accuracy: playerLocation.accuracy,
  },
  level: randomLevel(),
  stats: {
    hp: getStat(spawn.pokemon, 'hp'),
    attack: getStat(spawn.pokemon, 'attack'),
    defense: getStat(spawn.pokemon, 'defense'),
    speed: getStat(spawn.pokemon, 'speed'),
  },
  spriteUrl: spawn.pokemon.sprites?.front_default,
  source: 'hunt',
});

export const saveCapture = async (uid: string, spawn: SpawnedPokemon, playerLocation: Location) => {
  const capture = buildCapturePayload(spawn, playerLocation);
  await addCapturedPokemon(uid, capture);
  await incrementCaptureCount(uid);
  return capture;
};

