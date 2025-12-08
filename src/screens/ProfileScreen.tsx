import React from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../AuthContext';

export const ProfileScreen = () => {
  const { profile, profileLoading, signOut, user } = useAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = async () => {
    await signOut();
  };

  if (profileLoading) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom + 24 }]}>
        <ActivityIndicator size="large" color="#ef5350" />
      </View>
    );
  }

  const lastHuntAt = profile?.stats?.lastHuntAt;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 12 },
      ]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Trainer</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{profile?.displayName ?? 'Unknown Trainer'}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{profile?.email ?? user?.email ?? 'n/a'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Preferences</Text>
        <Text style={styles.label}>Units</Text>
        <Text style={styles.value}>{profile?.preferences.units ?? 'metric'}</Text>
        <Text style={styles.label}>Notifications</Text>
        <Text style={styles.value}>{profile?.preferences.notifications ? 'On' : 'Off'}</Text>
        <Text style={styles.label}>Map Style</Text>
        <Text style={styles.value}>{profile?.preferences.mapStyle ?? 'standard'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.label}>Total Caught</Text>
        <Text style={styles.value}>{profile?.stats?.totalCaught ?? 0}</Text>
        <Text style={styles.label}>Last Hunt</Text>
        <Text style={styles.value}>
          {lastHuntAt ? new Date(lastHuntAt.toDate()).toLocaleString() : '—'}
        </Text>
      </View>

      <View style={styles.card}>
        <Button title="Log out" color="#ef5350" onPress={handleSignOut} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

