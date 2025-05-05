import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
  Linking
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/hooks/useAuth';
import patientService, { PatientProfileData } from '@/src/services/patient.service';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<PatientProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9147, // Default to Sri Lanka
    longitude: 79.9729,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Define fixed gradient colors for header
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Theme-specific colors for components
  const cardBackground = isDarkMode ? '#1e2022' : '#fff';
  const cardBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const dividerColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const iconColor = isDarkMode ? '#A1CEDC' : '#0a7ea4';
  const primaryColor = isDarkMode ? '#A1CEDC' : '#0a7ea4';
  const accentColor = '#FF9800';
  const logoutColor = '#e53935';

  useEffect(() => {
    fetchProfileData();
    loadUserPreferences();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientService.getMyProfile();

      if (response.success && response.data) {
        setProfile(response.data);

        // If profile has location, update map region
        if (response.data.latitude && response.data.longitude) {
          setMapRegion({
            latitude: parseFloat(response.data.latitude),
            longitude: parseFloat(response.data.longitude),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      } else {
        setError(response.message || 'Failed to load profile data');
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(err?.message || 'An error occurred while loading your profile');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      // Load user preferences from storage
      const notificationsPref = await AsyncStorage.getItem('notifications_enabled');
      setNotificationsEnabled(notificationsPref !== 'false');

      const locationPref = await AsyncStorage.getItem('location_enabled');
      setLocationEnabled(locationPref === 'true');

      const darkModePref = await AsyncStorage.getItem('dark_mode_enabled');
      setDarkModeEnabled(darkModePref === 'true');
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notifications_enabled', value ? 'true' : 'false');
    } catch (err) {
      console.error('Error saving notification preference:', err);
    }
  };

  const toggleLocation = async (value: boolean) => {
    setLocationEnabled(value);
    try {
      if (value) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required for this feature.');
          setLocationEnabled(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }

      await AsyncStorage.setItem('location_enabled', value ? 'true' : 'false');
    } catch (err) {
      console.error('Error saving location preference:', err);
      setLocationEnabled(false);
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    try {
      await AsyncStorage.setItem('dark_mode_enabled', value ? 'true' : 'false');

      // Note: In a real app, you would update the app theme here
      Alert.alert('Theme Preference Saved', 'This setting will take effect when you restart the app', [
        { text: 'OK' },
      ]);
    } catch (err) {
      console.error('Error saving dark mode preference:', err);
    }
  };

  const formatDateOfBirth = (dateString: string | undefined) => {
    if (!dateString) return 'Not specified';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return null;

    const birthDate = new Date(dateOfBirth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert('Logout Failed', 'An error occurred during logout.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const onMapReady = () => {
    setIsMapReady(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#151718' : '#f8f8f8' }]}>
        <ActivityIndicator size="large" color={iconColor} />
        <ThemedText style={styles.loadingText}>Loading your profile...</ThemedText>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#151718' : '#f8f8f8' }]}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#151718' : '#f8f8f8' }]}>
      {/* Profile Header */}
      <LinearGradient colors={isDarkMode ? headerGradientDark : headerGradientLight} style={styles.header}>
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <Ionicons name="person" size={60} color="#ccc" />
              <TouchableOpacity style={styles.editImageButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText style={styles.profileName}>{profile?.name || 'User'}</ThemedText>
            <ThemedText style={styles.profileEmail}>{profile?.email || 'user@example.com'}</ThemedText>

            <TouchableOpacity
              style={[styles.editProfileButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={() => router.push('/edit-profile')}
            >
              <Feather name="edit-2" size={16} color="#fff" />
              <ThemedText style={styles.editProfileText}>Edit Profile</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Patient Info */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={22} color={iconColor} />
            <ThemedText style={styles.cardTitle}>Personal Information</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Full Name</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.name || 'Not specified'}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Date of Birth</ThemedText>
            <ThemedText style={styles.infoValue}>{formatDateOfBirth(profile?.date_of_birth)}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Age</ThemedText>
            <ThemedText style={styles.infoValue}>{calculateAge(profile?.date_of_birth) || 'Not specified'}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Gender</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.gender || 'Not specified'}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Blood Group</ThemedText>
            <View style={[styles.bloodGroupBadge, { backgroundColor: '#e74c3c' }]}>
              <ThemedText style={styles.bloodGroupText}>{profile?.blood_group || 'Not specified'}</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.phone || 'Not specified'}</ThemedText>
          </View>
        </ThemedView>

        {/* Medical Information */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit" size={22} color={iconColor} />
            <ThemedText style={styles.cardTitle}>Medical Information</ThemedText>
          </View>

          <View style={styles.infoSection}>
            <ThemedText style={styles.sectionLabel}>Allergies</ThemedText>
            <ThemedText style={styles.sectionValue}>
              {profile?.allergies ? profile.allergies : 'No known allergies'}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoSection}>
            <ThemedText style={styles.sectionLabel}>Medical History</ThemedText>
            <ThemedText style={styles.sectionValue}>
              {profile?.medical_history ? profile.medical_history : 'No medical history recorded'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Emergency Contact */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="call" size={22} color={accentColor} />
            <ThemedText style={styles.cardTitle}>Emergency Contact</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Contact Name</ThemedText>
            <ThemedText style={styles.infoValue}>{profile?.emergency_contact_name || 'Not specified'}</ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Contact Phone</ThemedText>
            <View style={styles.phoneContainer}>
              <ThemedText style={styles.infoValue}>
                {profile?.emergency_contact_phone || 'Not specified'}
              </ThemedText>

              {profile?.emergency_contact_phone && (
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: accentColor }]}
                  onPress={() => Linking.openURL(`tel:${profile?.emergency_contact_phone}`)}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ThemedView>

        {/* App Settings */}
        <ThemedView style={[styles.card, { backgroundColor: cardBackground, borderColor: cardBorderColor }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="settings" size={22} color={iconColor} />
            <ThemedText style={styles.cardTitle}>App Settings</ThemedText>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={20} color={iconColor} />
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: isDarkMode ? '#A1CEDC' : '#0a7ea4' }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color={iconColor} />
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: isDarkMode ? '#A1CEDC' : '#0a7ea4' }}
              thumbColor={darkModeEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="location" size={20} color={iconColor} />
              <ThemedText style={styles.settingLabel}>Location Services</ThemedText>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={toggleLocation}
              trackColor={{ false: '#767577', true: isDarkMode ? '#A1CEDC' : '#0a7ea4' }}
              thumbColor={locationEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.helpButton]} onPress={() => router.push('/help')}>
            <Ionicons name="help-circle" size={22} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Help & Support</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out" size={22} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <ThemedText style={styles.versionText}>Doc-Assist-Pro v1.0.0</ThemedText>

        {/* Bottom Padding for better scrolling with tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileHeaderContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0a7ea4',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  bloodGroupBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  bloodGroupText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    opacity: 0.7,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    marginLeft: 10,
    padding: 6,
    borderRadius: 6,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    marginLeft: 10,
  },
  actionButtonsContainer: {
    marginVertical: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: '#0a7ea4',
  },
  logoutButton: {
    backgroundColor: '#e53935',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 10,
    marginBottom: 20,
  },
});