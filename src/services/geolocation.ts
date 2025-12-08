import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
export type Location = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type LocationError = {
  code: number;
  message: string;
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineGranted = result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted = result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      // Accept coarse if user declines precise but allows approximate
      return fineGranted || coarseGranted;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }
  return true; // iOS handles permissions via Info.plist
};

export const getCurrentLocation = async (): Promise<Location> => {
  const tryGet = (options: { enableHighAccuracy: boolean; timeout: number; maximumAge: number }) =>
    new Promise<Location>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          reject({
            code: error.code,
            message: error.message,
          } as LocationError);
        },
        options,
      );
    });

  try {
    return await tryGet({ enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 });
  } catch (err) {
    console.warn('High accuracy location failed, retrying with coarse:', err);
    return await tryGet({ enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 });
  }
};

export const watchLocation = (
  onSuccess: (location: Location) => void,
  onError: (error: LocationError) => void,
): number => {
  return Geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => {
      onError({
        code: error.code,
        message: error.message,
      } as LocationError);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 3, // Update every 3 meters
      interval: 3000, // Update every 3 seconds
      fastestInterval: 2000,
    },
  );
};

export const clearWatch = (watchId: number) => {
  Geolocation.clearWatch(watchId);
};

export const requestLocationAccess = async (): Promise<boolean> => {
  return await requestLocationPermission();
};

// Biome detection based on coordinates
export type Biome = 'urban' | 'rural' | 'water' | 'forest' | 'mountain' | 'unknown';

// Deterministic biome selection using lat/lng hash (no external API)
export const detectBiome = (location: Location): Biome => {
  const { latitude, longitude } = location;
  const hash = Math.abs(Math.floor((latitude + longitude) * 1000)) % 10;

  if (hash < 3) return 'water';
  if (hash < 5) return 'forest';
  if (hash < 7) return 'urban';
  if (hash < 9) return 'rural';
  return 'mountain';
};

// Get Pokémon types that spawn in a biome
export const getBiomePokemonTypes = (biome: Biome): string[] => {
  const biomeTypes: Record<Biome, string[]> = {
    urban: ['normal', 'electric', 'poison', 'psychic'],
    rural: ['normal', 'grass', 'ground', 'bug'],
    water: ['water', 'ice', 'flying'],
    forest: ['grass', 'bug', 'flying', 'normal'],
    mountain: ['rock', 'ground', 'ice', 'steel'],
    unknown: ['normal'],
  };

  return biomeTypes[biome] || ['normal'];
};

