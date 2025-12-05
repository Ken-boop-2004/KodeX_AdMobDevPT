import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { getCaughtPokemon, CaughtPokemon } from '../services/pokemonCollection';
import { useAuth } from '../../AuthContext';
import { MainStackParamList } from '../navigation/types';
import { capitalize } from '../utils/pokemon';

type Props = NativeStackScreenProps<MainStackParamList, 'Pokedex'>;

export const CaughtPokemonScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [caughtPokemon, setCaughtPokemon] = useState<CaughtPokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCaughtPokemon = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const pokemon = await getCaughtPokemon(user.uid);
      setCaughtPokemon(pokemon);
    } catch (error) {
      console.error('Failed to load caught Pokemon:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCaughtPokemon();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadCaughtPokemon();
  };

  const renderPokemon = ({ item }: { item: CaughtPokemon }) => (
    <TouchableOpacity style={styles.card}>
      <Image
        source={{ uri: item.pokemonData.sprites.front_default }}
        style={styles.sprite}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{capitalize(item.pokemonName)}</Text>
        <Text style={styles.id}>#{item.pokemonId}</Text>
        <Text style={styles.date}>
          Caught: {item.caughtAt.toLocaleDateString()}
        </Text>
        {item.biome && (
          <View style={styles.biomeContainer}>
            <Text style={[
              styles.biome, 
              item.biome === 'ar-camera' && styles.arBiome
            ]}>
              {item.biome === 'ar-camera' ? '📷 AR Camera' : `🌍 ${capitalize(item.biome)}`}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>Loading your collection...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Please log in to view your collection</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Collection</Text>
        <Text style={styles.count}>{caughtPokemon.length} Pokémon Caught</Text>
      </View>

      {caughtPokemon.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No Pokémon caught yet!</Text>
          <Text style={styles.emptySubtext}>
            Go to the Hunt tab to start catching Pokémon
          </Text>
        </View>
      ) : (
        <FlatList
          data={caughtPokemon}
          keyExtractor={(item) => item.id}
          renderItem={renderPokemon}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#E63946',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  count: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sprite: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  id: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  biomeContainer: {
    marginTop: 4,
  },
  biome: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  arBiome: {
    color: '#E63946',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#E63946',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
