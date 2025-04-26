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
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/hooks/useAuth';
import patientService, { PatientProfileData } from '@/src/services/patient.service';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { logout, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<PatientProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data when component mounts
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Function to fetch patient profile data
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientService.getMyProfile();
      if (response.success && response.data) {
        setProfileData(response.data);
      } else {
        setError('Failed to load profile data');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err?.message || 'An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            try {
              await logout();
              // Navigation is handled by the AuthContext redirect
            } catch (error) {
              Alert.alert('Logout Error', 'Failed to logout. Please try again.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(previous => !previous);
  };

  const toggleDarkMode = () => {
    setDarkModeEnabled(previous => !previous);
    // In a real app, you would actually change the theme here
    // This is just for UI demonstration purposes
  };
  
  // Define fixed gradient colors for LinearGradient
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;

  // Format allergies as an array for display
  const allergiesList = profileData?.allergies ? 
    profileData.allergies.split(',').map(item => item.trim()).filter(item => item.length > 0) : 
    [];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={50} color="#e53935" />
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfileData}>
          <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
        style={styles.header}
      >
        <View style={styles.profileHeaderContent}>
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageWrapper}>
              <Ionicons name="person" size={60} color="#ccc" />
              <TouchableOpacity style={styles.editImageButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.profileNameContainer}>
            <ThemedText style={styles.profileName}>
              {profileData?.user ? `${profileData.user.first_name || ''} ${profileData.user.last_name || ''}`.trim() : 'User'}
            </ThemedText>
            <View style={styles.patientBadge}>
              <ThemedText style={styles.patientBadgeText}>Patient</ThemedText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <ThemedText style={styles.editProfileButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.contentContainer}>
        {/* Personal Information Section */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.sectionTitle}>Personal Information</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.user?.email || 'Not provided'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.user?.phone || 'Not provided'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Date of Birth</ThemedText>
            <ThemedText style={styles.infoValue}>
              {profileData?.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'Not provided'}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Gender</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.gender || 'Not provided'}</ThemedText>
          </View>
        </ThemedView>
        
        {/* Medical Information Section */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Blood Type</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.blood_group || 'Not provided'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Medical History</ThemedText>
            <ThemedText style={styles.infoValue} numberOfLines={2}>
              {profileData?.medical_history || 'None'}
            </ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Allergies</ThemedText>
            {allergiesList.length > 0 ? (
              <View style={styles.allergiesContainer}>
                {allergiesList.map((allergy, index) => (
                  <View key={index} style={styles.allergyTag}>
                    <ThemedText style={styles.allergyText}>{allergy}</ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText style={styles.infoValue}>None</ThemedText>
            )}
          </View>
        </ThemedView>

        {/* Emergency Contact */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="alert-circle" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.sectionTitle}>Emergency Contact</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Name</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.emergency_contact_name || 'Not provided'}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{profileData?.emergency_contact_phone || 'Not provided'}</ThemedText>
          </View>
        </ThemedView>
        
        {/* Preferences */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
            <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={20} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#767577', true: colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4' }}
              thumbColor={notificationsEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4' }}
              thumbColor={darkModeEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.helpButton]}
            onPress={() => router.push('/help')}
          >
            <Ionicons name="help-circle" size={22} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Help & Support</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={22} color="#fff" />
            <ThemedText style={styles.actionButtonText}>Logout</ThemedText>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <ThemedText style={styles.versionText}>
          Doc-Assist-Pro v1.0.0
        </ThemedText>
        
        {/* Bottom spacing for bottom tabs */}
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
  profileNameContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  patientBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  patientBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  editProfileButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
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
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '60%',
  },
  allergyTag: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 6,
    marginBottom: 4,
  },
  allergyText: {
    fontSize: 12,
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