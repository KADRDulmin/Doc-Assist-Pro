import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Switch, RefreshControl, Platform, Alert } from 'react-native';
import { Avatar, Divider, Dialog, Portal, Button } from 'react-native-paper';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useAuth } from '../../contexts/AuthContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import Colors from '../../constants/Colors';
import ModernHeader from '../../components/ui/ModernHeader';
import doctorService from '../../services/doctorService';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const router = useRouter();
  
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [localUser, setLocalUser] = useState(user);
  
  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const notificationPref = await AsyncStorage.getItem('notifications-enabled');
        if (notificationPref !== null) {
          setNotificationsEnabled(notificationPref === 'true');
        }
        
        // Profile image would typically be loaded from user profile
        const savedProfileImage = await AsyncStorage.getItem('profile-image');
        if (savedProfileImage) {
          setProfileImage(savedProfileImage);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Update local user state when user changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh user profile data, including stats
    const refreshUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('doctor_auth_token');
        if (!token) {
          console.error('No auth token found');
          setRefreshing(false);
          return;
        }
        
        // Get updated dashboard data
        const dashboardResponse = await doctorService.getDashboard(token);
        
        if (dashboardResponse.success && dashboardResponse.data) {
          // Create a copy of the current user
          const updatedUser = localUser ? { ...localUser } : null;
          
          if (updatedUser) {
            // Update with latest stats
            updatedUser.appointments_count = dashboardResponse.data.stats.appointmentCount;
            updatedUser.patients_count = dashboardResponse.data.stats.patientCount;
            updatedUser.experience_years = dashboardResponse.data.profile.years_of_experience;
            
            // Update local state
            setLocalUser(updatedUser);
            
            // Save to AsyncStorage
            await AsyncStorage.setItem('doctor_user_data', JSON.stringify(updatedUser));
            
            // Show a success alert
            Alert.alert(
              "Profile Updated",
              "Your profile statistics have been refreshed.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        console.error('Failed to refresh profile data:', error);
        Alert.alert(
          "Refresh Failed",
          "There was a problem refreshing your profile data. Please try again.",
          [{ text: "OK" }]
        );
      } finally {
        setRefreshing(false);
      }
    };
    
    refreshUserData();
  }, [localUser]);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Permission to access your photo library is required to update your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        setProfileImage(selectedImage);
        
        // Save selected image locally (in production, would upload to server)
        try {
          await AsyncStorage.setItem('profile-image', selectedImage);
          console.log('Profile image saved locally');
        } catch (error) {
          console.error('Failed to save profile image:', error);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const toggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    
    try {
      // In a real app, you'd store the preference and apply it
      await AsyncStorage.setItem('theme-preference', value ? 'dark' : 'light');
      console.log('Theme preference saved:', value ? 'dark' : 'light');
      
      // Note: In a full implementation, this would trigger theme change in the app
      Alert.alert(
        'Theme Preference Saved',
        'This setting will take effect when you restart the app.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    try {
      await AsyncStorage.setItem('notifications-enabled', value.toString());
      console.log('Notification preference saved:', value);
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  };

  const confirmLogout = () => {
    setLogoutDialogVisible(false);
    signOut();
  };
  // Default data if user object is incomplete
  const userFullName = localUser 
    ? `Dr. ${localUser.first_name || ''} ${localUser.last_name || ''}`.trim() 
    : 'Doctor';
  
  const userSpecialty = localUser?.specialty || 'General Practitioner';
  const userEmail = localUser?.email || 'doctor@example.com';
  const userPhone = localUser?.phone || '+1 123-456-7890';
  
  // Get user initials for avatar
  const userInitials = `${localUser?.first_name?.[0] || ''}${localUser?.last_name?.[0] || ''}`.toUpperCase();
  
  return (
    <ThemedView variant="secondary" style={styles.container}>      <ModernHeader 
        title="My Profile"
        showBackButton={false}
        userName={`Dr. ${localUser?.last_name || 'Smith'}`}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors[theme].primary]}
            tintColor={Colors[theme].primary}
          />
        }
      >
        {/* Profile Header */}
        <ThemedView variant="card" useShadow style={styles.profileHeader}>
          <LinearGradient
            colors={Colors[theme].primary === Colors.light.primary 
              ? ['rgba(4, 102, 200, 0.1)', 'rgba(4, 102, 200, 0.02)'] 
              : ['rgba(88, 176, 237, 0.1)', 'rgba(88, 176, 237, 0.02)']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Avatar.Image
                size={110}
                source={{ uri: profileImage }}
              />
            ) : (
              <LinearGradient
                colors={Colors[theme].primary === Colors.light.primary 
                  ? ['#0466C8', '#0353A4'] 
                  : ['#58B0ED', '#0466C8']}
                style={styles.avatarGradient}
              >
                <Avatar.Text
                  size={110}
                  label={userInitials}
                  labelStyle={{ fontSize: 40 }}
                  style={{ backgroundColor: 'transparent' }}
                />
              </LinearGradient>
            )}
            <TouchableOpacity 
              style={[styles.editAvatarButton, { backgroundColor: Colors[theme].primary }]} 
              onPress={pickImage}
            >
              <FontAwesome5 name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          <ThemedText type="heading" style={styles.doctorName}>
            {userFullName}
          </ThemedText>
          
          <View style={styles.specialtyContainer}>
            <FontAwesome5 name="stethoscope" size={14} color={Colors[theme].primary} style={styles.specialtyIcon} />
            <ThemedText variant="secondary" style={styles.specialty}>
              {userSpecialty}
            </ThemedText>
          </View>
          
          <View style={styles.statsContainer}>            <ThemedView 
              variant="cardAlt" 
              style={styles.statItem}
            >
              <ThemedText type="heading" style={styles.statNumber}>
                {localUser?.appointments_count || 0}
              </ThemedText>
              <ThemedText variant="tertiary">Appointments</ThemedText>
            </ThemedView>
            
            <ThemedView 
              variant="cardAlt" 
              style={styles.statItem}
            >
              <ThemedText type="heading" style={styles.statNumber}>
                {localUser?.patients_count || 0}
              </ThemedText>
              <ThemedText variant="tertiary">Patients</ThemedText>
            </ThemedView>
            
            <ThemedView 
              variant="cardAlt" 
              style={styles.statItem}
            >
              <ThemedText type="heading" style={styles.statNumber}>
                {localUser?.experience_years || 0}
              </ThemedText>
              <ThemedText variant="tertiary">Years</ThemedText>
            </ThemedView>
          </View>
        </ThemedView>
        
        {/* Contact Information */}
        <ThemedView variant="card" useShadow style={styles.sectionCard}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="address-card" size={16} color={Colors[theme].primary} />
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Contact Information
            </ThemedText>
          </View>
          
          <View style={styles.contactItem}>
            <View style={[styles.contactIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
              <FontAwesome5 name="envelope" size={16} color={Colors[theme].primary} />
            </View>
            <View style={styles.contactContent}>
              <ThemedText variant="secondary" style={styles.contactLabel}>
                Email Address
              </ThemedText>
              <ThemedText>{userEmail}</ThemedText>
            </View>
          </View>
          
          <View style={styles.contactItem}>
            <View style={[styles.contactIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
              <FontAwesome5 name="phone-alt" size={16} color={Colors[theme].primary} />
            </View>
            <View style={styles.contactContent}>
              <ThemedText variant="secondary" style={styles.contactLabel}>
                Phone Number
              </ThemedText>
              <ThemedText>{userPhone}</ThemedText>
            </View>
          </View>
            {localUser?.address && (
            <View style={styles.contactItem}>
              <View style={[styles.contactIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
                <FontAwesome5 name="map-marker-alt" size={16} color={Colors[theme].primary} />
              </View>
              <View style={styles.contactContent}>
                <ThemedText variant="secondary" style={styles.contactLabel}>
                  Office Address
                </ThemedText>
                <ThemedText>{localUser.address}</ThemedText>
              </View>
            </View>
          )}
          
          {localUser?.hospital && (
            <View style={styles.contactItem}>
              <View style={[styles.contactIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
                <FontAwesome5 name="hospital" size={16} color={Colors[theme].primary} />
              </View>
              <View style={styles.contactContent}>
                <ThemedText variant="secondary" style={styles.contactLabel}>
                  Hospital
                </ThemedText>
                <ThemedText>{localUser.hospital}</ThemedText>
              </View>
            </View>
          )}
        </ThemedView>
        
        {/* App Settings */}
        <ThemedView variant="card" useShadow style={styles.sectionCard}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="sliders-h" size={16} color={Colors[theme].primary} />
            <ThemedText type="subheading" style={styles.sectionTitle}>
              App Settings
            </ThemedText>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
                <Ionicons name="notifications" size={18} color={Colors[theme].primary} />
              </View>
              <View>
                <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
                <ThemedText variant="tertiary" style={styles.settingDescription}>
                  Receive updates about your appointments
                </ThemedText>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              thumbColor={Platform.OS === 'ios' ? undefined : notificationsEnabled ? Colors[theme].primary : '#f4f3f4'}
              trackColor={{ 
                false: Platform.OS === 'ios' ? undefined : Colors[theme].borderLight, 
                true: Platform.OS === 'ios' ? Colors[theme].primary : `${Colors[theme].primary}80`
              }}
              ios_backgroundColor={Colors[theme].borderLight}
            />
          </View>
          
          <View style={styles.settingDivider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <View style={[styles.settingIconContainer, { backgroundColor: `${Colors[theme].primary}15` }]}>
                <Ionicons name={colorScheme === 'dark' ? "moon" : "sunny"} size={18} color={Colors[theme].primary} />
              </View>
              <View>
                <ThemedText style={styles.settingLabel}>Dark Mode</ThemedText>
                <ThemedText variant="tertiary" style={styles.settingDescription}>
                  Switch between light and dark themes
                </ThemedText>
              </View>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={toggleDarkMode}
              thumbColor={Platform.OS === 'ios' ? undefined : darkModeEnabled ? Colors[theme].primary : '#f4f3f4'}
              trackColor={{ 
                false: Platform.OS === 'ios' ? undefined : Colors[theme].borderLight, 
                true: Platform.OS === 'ios' ? Colors[theme].primary : `${Colors[theme].primary}80`
              }}
              ios_backgroundColor={Colors[theme].borderLight}
            />
          </View>
        </ThemedView>
        
        {/* Security */}
        <ThemedView variant="card" useShadow style={styles.sectionCard}>
          <View style={styles.sectionTitleContainer}>
            <FontAwesome5 name="shield-alt" size={16} color={Colors[theme].primary} />
            <ThemedText type="subheading" style={styles.sectionTitle}>
              Security
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Change Password', 'This feature will be available in the next update.')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="form-textbox-password" size={18} color={Colors[theme].primary} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText>Change Password</ThemedText>
              <FontAwesome5 name="chevron-right" size={14} color={Colors[theme].textTertiary} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Two-Factor Authentication', 'This feature will be available in the next update.')}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons name="two-factor-authentication" size={18} color={Colors[theme].primary} />
            </View>
            <View style={styles.menuContent}>
              <ThemedText>Two-Factor Authentication</ThemedText>
              <FontAwesome5 name="chevron-right" size={14} color={Colors[theme].textTertiary} />
            </View>
          </TouchableOpacity>
        </ThemedView>
        
        {/* Actions */}
        <View style={styles.actionsContainer}>          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push("/edit-profile")}
          >
            <LinearGradient
              colors={Colors[theme].primary === Colors.light.primary 
                ? ['#0466C8', '#0353A4'] 
                : ['#58B0ED', '#0466C8']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <FontAwesome5 name="user-edit" size={16} color="#FFF" />
              <ThemedText style={styles.primaryButtonText}>Edit Profile</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: Colors[theme].danger }]}
            onPress={() => setLogoutDialogVisible(true)}
          >
            <FontAwesome5 name="sign-out-alt" size={16} color={Colors[theme].danger} />
            <ThemedText style={[styles.outlineButtonText, { color: Colors[theme].danger }]}>
              Logout
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* App Info */}
        <ThemedText 
          variant="tertiary" 
          style={styles.versionText}
        >
          Doc-Assist Pro v1.0.0
        </ThemedText>
      </ScrollView>
      
      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={{ backgroundColor: Colors[theme].card }}
        >
          <Dialog.Title>
            <ThemedText type="subheading">Confirm Logout</ThemedText>
          </Dialog.Title>
          <Dialog.Content>
            <ThemedText>Are you sure you want to logout from your account?</ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setLogoutDialogVisible(false)}
              textColor={Colors[theme].text}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmLogout}
              textColor={Colors[theme].danger}
            >
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    right: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  doctorName: {
    textAlign: 'center',
    fontSize: 22,
    marginBottom: 6,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  specialtyIcon: {
    marginRight: 6,
  },
  specialty: {
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    marginBottom: 4,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  settingDivider: {
    height: 1,
    marginVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  actionsContainer: {
    marginVertical: 16,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  outlineButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
  },
  outlineButtonText: {
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 8,
  },
});