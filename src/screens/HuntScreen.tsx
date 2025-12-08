import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { CONFIG } from '../config/appConfig';

// Mapbox access token required by @rnmapbox/maps
MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN || '');
MapboxGL.setTelemetryEnabled(false);

import {
  getCurrentLocation,
  requestLocationAccess,
  watchLocation,
  clearWatch,
  Location,
  LocationError,
} from '../services/geolocation';
import {
  spawnPokemonBatch,
  SpawnedPokemon,
  removeSpawn,
  calculateDistanceMeters,
  getActiveSpawns,
  MIN_SPAWNS,
  MAX_SPAWNS,
} from '../services/pokemonSpawn';
import { MainStackParamList } from '../navigation/types';
import { capitalize } from '../utils/pokemon';
import { saveCapture } from '../services/capture';
import { useAuth } from '../../AuthContext';

type Props = NativeStackScreenProps<MainStackParamList, 'Hunt'>;

export const HuntScreen = ({ navigation }: Props) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [spawns, setSpawns] = useState<SpawnedPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [hunting, setHunting] = useState(false);
  const [catchingId, setCatchingId] = useState<string | null>(null);
  const [hasCentered, setHasCentered] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const huntingRef = useRef(hunting);
  const spawnsRef = useRef<SpawnedPokemon[]>([]);
  const mapRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const { user } = useAuth();
  const CATCH_RADIUS = 5; // meters

  useEffect(() => {
    huntingRef.current = hunting;
  }, [hunting]);

  const refreshSpawns = useCallback(
    async (loc: Location, desiredCount?: number) => {
      console.log('[Hunt] Refreshing spawns near', loc);
      await spawnPokemonBatch(loc, desiredCount);
      const active = getActiveSpawns();
      spawnsRef.current = active;
      setSpawns(active);
    },
    [],
  );

  // Always guarantee minimum spawns
  useEffect(() => {
    if (location && spawns.length < MIN_SPAWNS) {
      refreshSpawns(location, MIN_SPAWNS);
    }
  }, [location, spawns.length, refreshSpawns]);

  const startRefreshTimer = useCallback(
    (loc: Location) => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      refreshTimerRef.current = setInterval(() => {
        refreshSpawns(loc, MIN_SPAWNS + Math.floor(Math.random() * (MAX_SPAWNS - MIN_SPAWNS + 1)));
      }, 120000); // every 2 minutes
    },
    [refreshSpawns],
  );

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const loadLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const hasPermission = await requestLocationAccess();
      if (!hasPermission) {
        setError('Location permission is required to hunt Pokémon.');
        setLoading(false);
        return;
      }

      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);

      // Spawn initial Pokémon batch (guaranteed)
      await refreshSpawns(
        currentLocation,
        MIN_SPAWNS + Math.floor(Math.random() * (MAX_SPAWNS - MIN_SPAWNS + 1)),
      );

      // Start watching location
      const id = watchLocation(
        (newLocation) => {
          setLocation(newLocation);
          console.log('[Hunt] Location update', newLocation);
        },
        (err: LocationError) => {
          setError(`Location error: ${err.message}`);
        },
      );

      setWatchId(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [refreshSpawns]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        clearWatch(watchId);
      }
      stopRefreshTimer();
    };
  }, [watchId, stopRefreshTimer]);

  const handleStartHunting = () => {
    setHunting(true);
    if (location) {
      refreshSpawns(location);
      startRefreshTimer(location);
    }
  };

  const handleStopHunting = () => {
    setHunting(false);
    stopRefreshTimer();
  };

  const handlePokemonTap = (spawn: SpawnedPokemon) => {
    Alert.alert(
      capitalize(spawn.pokemon.name),
      `Found ${capitalize(spawn.pokemon.name)} nearby!`,
      [
        {
          text: 'View Details',
          onPress: () => {
            // Navigate to PokemonDetail in the same stack
            navigation.navigate('PokemonDetail', {
              pokemonId: spawn.pokemon.id,
              name: spawn.pokemon.name,
            });
          },
        },
        { text: 'Catch', onPress: () => handleCatchPokemon(spawn) },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleCatchPokemon = async (spawn: SpawnedPokemon) => {
    if (!user) {
      Alert.alert('Login required', 'Please sign in to catch Pokémon.');
      return;
    }

    if (!location) {
      Alert.alert('Location unavailable', 'We need your location to catch this Pokémon.');
      return;
    }

    // prevent duplicate taps while saving
    if (catchingId === spawn.id) {
      return;
    }
    setCatchingId(spawn.id);

    try {
      const distance = calculateDistanceMeters(location, spawn.location);
      if (distance > CATCH_RADIUS) {
        Alert.alert(
          'Too far away',
          `Move closer to ${capitalize(spawn.pokemon.name)} (within ${CATCH_RADIUS}m) to catch it.`,
        );
        setCatchingId(null);
        return;
      }

      const success = Math.random() < 0.75;
      if (!success) {
        Alert.alert('Oh no!', `${capitalize(spawn.pokemon.name)} escaped. Try again!`);
        setCatchingId(null);
        return;
      }

      await saveCapture(user.uid, spawn, location);
      removeSpawn(spawn.id);
      setSpawns((prev) => prev.filter((s) => s.id !== spawn.id));
      Alert.alert('Gotcha!', `You caught ${capitalize(spawn.pokemon.name)}!`);
    } catch (err) {
      console.error('Capture error', err);
      Alert.alert('Error', 'Could not save your capture. Please try again.');
    } finally {
      setCatchingId(null);
    }
  };

  const handleRefresh = () => {
    if (location) {
      refreshSpawns(location);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ef5350" />
        <Text style={styles.loaderText}>Finding your location...</Text>
      </View>
    );
  }

  if (error || !location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Unable to get location'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderMarker = (spawn: SpawnedPokemon) => {
    const distance = location ? Math.round(calculateDistanceMeters(location, spawn.location)) : 0;
    const withinCatch = distance <= CATCH_RADIUS;
    return (
      <MapboxGL.PointAnnotation
        id={spawn.id}
        key={spawn.id}
        coordinate={[spawn.location.longitude, spawn.location.latitude]}
        onSelected={() => handleCatchPokemon(spawn)}
      >
        <TouchableOpacity activeOpacity={0.8} onPress={() => handleCatchPokemon(spawn)}>
          <View style={[styles.markerContainer, withinCatch && styles.markerHighlight]}>
            <Image
              source={{ uri: spawn.pokemon.sprites?.front_default || '' }}
              style={styles.markerImage}
            />
            <Text style={styles.markerName}>{capitalize(spawn.pokemon.name)}</Text>
            <Text style={[styles.markerDistance, withinCatch && styles.markerDistanceClose]}>
              {distance}m away
            </Text>
          </View>
        </TouchableOpacity>
      </MapboxGL.PointAnnotation>
    );
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={17}
          centerCoordinate={[location.longitude, location.latitude]}
          animationMode="easeTo"
          animationDuration={600}
        />
        <MapboxGL.UserLocation
          visible
          requestsAlwaysUse
          onUpdate={(pos: any) => {
            const { coords } = pos;
            if (coords?.latitude && coords?.longitude) {
              const updated: Location = {
                latitude: coords.latitude,
                longitude: coords.longitude,
                accuracy: coords.accuracy ?? undefined,
              };
              setLocation(updated);
              if (!hasCentered && cameraRef.current) {
                cameraRef.current.setCamera({
                  centerCoordinate: [coords.longitude, coords.latitude],
                  zoomLevel: 18,
                  animationDuration: 600,
                });
                setHasCentered(true);
              }
            }
          }}
        />

        {spawns.map(renderMarker)}
      </MapboxGL.MapView>

      <View style={styles.locateButtonContainer}>
        <TouchableOpacity
          style={styles.locateButton}
          onPress={() => {
            if (location && cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: [location.longitude, location.latitude],
                zoomLevel: 18,
                animationDuration: 400,
              });
            }
          }}
        >
          <Text style={styles.locateButtonText}>◎</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        {!hunting ? (
          <TouchableOpacity style={styles.huntButton} onPress={handleStartHunting}>
            <Text style={styles.huntButtonText}>Start Hunting</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopHunting}>
            <Text style={styles.stopButtonText}>Stop Hunting</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh Spawns</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.spawnInfo}>
        <Text style={styles.spawnInfoText}>{spawns.length} Pokémon nearby</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    backgroundColor: '#dfe7ef',
  },
  markerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef5350',
  },
  markerHighlight: {
    borderColor: '#43a047',
    shadowColor: '#43a047',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  markerImage: {
    width: 50,
    height: 50,
  },
  markerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b1b1f',
  },
  markerDistance: {
    fontSize: 11,
    color: '#555',
  },
  markerDistanceClose: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  locateButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  locateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#ececf2',
  },
  locateButtonText: {
    fontSize: 18,
    color: '#1e88e5',
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7fb',
    gap: 12,
  },
  loaderText: {
    color: '#4a4a4f',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7fb',
    padding: 16,
    gap: 16,
  },
  errorText: {
    color: '#b71c1c',
    textAlign: 'center',
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#ef5350',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  huntButton: {
    flex: 1,
    backgroundColor: '#ef5350',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  huntButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#b71c1c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  refreshButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ececf2',
  },
  refreshButtonText: {
    color: '#4a4a4f',
    fontWeight: '600',
  },
  spawnInfo: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 110,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  spawnInfoText: {
    color: '#4a4a4f',
    fontWeight: '600',
    textAlign: 'center',
  },
});