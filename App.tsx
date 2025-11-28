import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import LoadingScreen from './LoadingScreen';

const POKE_API_URL = 'https://pokeapi.co/api/v2/pokemon';
const PAGE_SIZE = 20;

type PokemonSummary = {
  name: string;
  url: string;
};

type PokemonDetail = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      ['official-artwork']?: {
        front_default: string | null;
      };
    };
  };
  types: { slot: number; type: { name: string } }[];
  abilities: { ability: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
};

type PokemonListResponse = {
  results: PokemonSummary[];
  next: string | null;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 0.75 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 750);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#ef5350" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  return <PokedexScreen />;
}

function PokedexScreen() {
  const [pokemon, setPokemon] = useState<PokemonDetail[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [nextOffset, setNextOffset] = useState<number>(0);

  const fetchPokemonBatch = async (offset: number) => {
    const listResponse = await fetch(`${POKE_API_URL}?offset=${offset}&limit=${PAGE_SIZE}`);
    if (!listResponse.ok) {
      throw new Error('Unable to load Pokémon list');
    }

    const listData: PokemonListResponse = await listResponse.json();
    const detailResponses = await Promise.all(
      listData.results.map(async (pokemonSummary) => {
        const detailResponse = await fetch(pokemonSummary.url);
        if (!detailResponse.ok) {
          throw new Error(`Unable to load data for ${pokemonSummary.name}`);
        }
        return (await detailResponse.json()) as PokemonDetail;
      }),
    );

    return {
      details: detailResponses,
      hasNext: Boolean(listData.next),
    };
  };

  const loadInitialPokemon = async () => {
    try {
      setError(null);
      setIsInitialLoading(true);
      const { details, hasNext } = await fetchPokemonBatch(0);
      setPokemon(details);
      setHasMore(hasNext);
      setNextOffset(PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    try {
      setError(null);
      setLoadingMore(true);
      const { details, hasNext } = await fetchPokemonBatch(nextOffset);
      setPokemon((prev) => [...prev, ...details]);
      setHasMore(hasNext);
      setNextOffset((prev) => prev + PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialPokemon();
  }, []);

  const hasData = pokemon.length > 0;
  const showFullScreenError = Boolean(error && !hasData);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pokédex</Text>
        <Text style={styles.headerSubtitle}>
          Browse Pokémon, their abilities, types, and stats powered by PokeAPI.
        </Text>
      </View>

      {error && hasData && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={loadInitialPokemon} style={styles.errorBannerButton}>
            <Text style={styles.errorBannerButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      )}

      {isInitialLoading && !hasData && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ef5350" />
          <Text style={styles.loaderText}>Loading Pokémon...</Text>
        </View>
      )}

      {showFullScreenError && (
        <ErrorState message={error!} onRetry={loadInitialPokemon} />
      )}

      {!showFullScreenError && hasData && (
        <FlatList
          data={pokemon}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PokemonCard pokemon={item} />}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.35}
          onEndReached={handleLoadMore}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color="#ef5350" />
                <Text style={styles.footerLoaderText}>Fetching more Pokémon...</Text>
              </View>
            ) : !hasMore ? (
              <Text style={styles.footerText}>You have reached the end of the Pokédex.</Text>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

type PokemonCardProps = {
  pokemon: PokemonDetail;
};

function PokemonCard({ pokemon }: PokemonCardProps) {
  const spriteUri =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.front_default ??
    '';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{capitalize(pokemon.name)}</Text>
        <Text style={styles.cardId}>{formatId(pokemon.id)}</Text>
      </View>

      {spriteUri ? (
        <Image source={{ uri: spriteUri }} style={styles.sprite} resizeMode="contain" />
      ) : (
        <View style={styles.spritePlaceholder}>
          <Text style={styles.spritePlaceholderText}>No image</Text>
        </View>
      )}

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Types</Text>
        <View style={styles.tagRow}>
          {pokemon.types.map(({ type }) => (
            <View key={type.name} style={styles.tag}>
              <Text style={styles.tagText}>{capitalize(type.name)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Abilities</Text>
        <Text style={styles.metaValue}>
          {pokemon.abilities.map(({ ability }) => capitalize(ability.name)).join(', ')}
        </Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>Base Stats</Text>
        {pokemon.stats.map(({ stat, base_stat }) => (
          <View key={stat.name} style={styles.statRow}>
            <Text style={styles.statName}>{capitalize(stat.name)}</Text>
            <Text style={styles.statValue}>{base_stat}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

const capitalize = (value: string) => {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatId = (id: number) => `#${id.toString().padStart(3, '0')}`;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1b1b1f',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#4a4a4f',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    color: '#4a4a4f',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1b1f',
  },
  cardId: {
    fontSize: 14,
    color: '#7b7b85',
  },
  sprite: {
    width: '100%',
    height: 160,
    marginBottom: 12,
  },
  spritePlaceholder: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  spritePlaceholderText: {
    color: '#7b7b85',
  },
  metaBlock: {
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a4a4f',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: '#1b1b1f',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#ffe0e0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b71c1c',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececf2',
  },
  statName: {
    fontSize: 14,
    color: '#4a4a4f',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1b1f',
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    color: '#4a4a4f',
  },
  footerText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#7b7b85',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#b71c1c',
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: 'center',
    color: '#4a4a4f',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ef5350',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffe0e0',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBannerText: {
    color: '#b71c1c',
    flex: 1,
    marginRight: 12,
  },
  errorBannerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#b71c1c',
  },
  errorBannerButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default App;
