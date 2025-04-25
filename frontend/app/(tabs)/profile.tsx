import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
  SafeAreaView,
  Alert,
  Switch,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/hooks/useAuth';

interface UserProfile {
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  height: string;
  weight: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phoneNumber: string;
  }
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');

  // Mock user profile data
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phoneNumber: '+1 (555) 123-4567',
    dateOfBirth: 'May 15, 1990',
    gender: 'Female',
    bloodType: 'O+',
    height: '165 cm',
    weight: '60 kg',
    allergies: ['Penicillin', 'Peanuts'],
    emergencyContact: {
      name: 'John Johnson',
      relationship: 'Spouse',
      phoneNumber: '+1 (555) 987-6543'
    }
  });

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
            <ThemedText style={styles.profileName}>{userProfile.name}</ThemedText>
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
            <ThemedText style={styles.infoValue}>{userProfile.email}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.phoneNumber}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Date of Birth</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.dateOfBirth}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Gender</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.gender}</ThemedText>
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
            <ThemedText style={styles.infoValue}>{userProfile.bloodType}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Height</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.height}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Weight</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.weight}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Allergies</ThemedText>
            <View style={styles.allergiesContainer}>
              {userProfile.allergies.map((allergy, index) => (
                <View key={index} style={styles.allergyTag}>
                  <ThemedText style={styles.allergyText}>{allergy}</ThemedText>
                </View>
              ))}
            </View>
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
            <ThemedText style={styles.infoValue}>{userProfile.emergencyContact.name}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Relationship</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.emergencyContact.relationship}</ThemedText>
          </View>
          
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{userProfile.emergencyContact.phoneNumber}</ThemedText>
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
  },
  allergiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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