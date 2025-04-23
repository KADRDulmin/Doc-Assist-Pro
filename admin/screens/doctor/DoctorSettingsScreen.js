import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ScrollView 
} from 'react-native';
import { Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../../contexts/AuthContext';
import Colors from '../../constants/Colors';

const DoctorSettingsScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [availableForAppointments, setAvailableForAppointments] = useState(true);

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        { 
          text: 'Cancel',
          style: 'cancel'
        },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  // Toggle setting values
  const togglePushNotifications = () => setPushNotifications(!pushNotifications);
  const toggleEmailNotifications = () => setEmailNotifications(!emailNotifications);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleAvailability = () => setAvailableForAppointments(!availableForAppointments);

  // Setting item component for toggle settings
  const SettingItem = ({ icon, title, description, value, onToggle }) => (
    <View style={styles.settingItem}>
      <MaterialIcons name={icon} size={24} color={Colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.lightGrey, true: Colors.lightPrimary }}
        thumbColor={value ? Colors.primary : '#f4f3f4'}
      />
    </View>
  );

  // Button item component for regular settings
  const ButtonItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={Colors.primary} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.grey} />
    </TouchableOpacity>
  );

  // Danger item component for sensitive settings
  const DangerItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={Colors.error} style={styles.settingIcon} />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: Colors.error }]}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={Colors.grey} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Account Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account</Text>
      </View>
      <Card containerStyle={styles.card}>
        <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profileIconContainer}>
            <Text style={styles.profileInitial}>{userInfo?.first_name?.[0] || 'D'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Dr. {userInfo?.first_name || ''} {userInfo?.last_name || 'User'}</Text>
            <Text style={styles.profileEmail}>{userInfo?.email || ''}</Text>
          </View>
          <MaterialIcons name="edit" size={24} color={Colors.primary} />
        </TouchableOpacity>
        
        <ButtonItem
          icon="vpn-key"
          title="Change Password"
          onPress={() => Alert.alert('Change Password', 'Navigate to password change screen')}
        />
        
        <ButtonItem
          icon="verified-user"
          title="Security Settings"
          onPress={() => Alert.alert('Security Settings', 'Navigate to security settings')}
        />
      </Card>

      {/* Notifications Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <Card containerStyle={styles.card}>
        <SettingItem
          icon="notifications"
          title="Push Notifications"
          description="Receive push notifications for appointments and updates"
          value={pushNotifications}
          onToggle={togglePushNotifications}
        />
        
        <SettingItem
          icon="email"
          title="Email Notifications"
          description="Receive email notifications for important updates"
          value={emailNotifications}
          onToggle={toggleEmailNotifications}
        />
      </Card>

      {/* Preferences Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Preferences</Text>
      </View>
      <Card containerStyle={styles.card}>
        <SettingItem
          icon="brightness-4"
          title="Dark Mode"
          description="Enable dark mode theme"
          value={darkMode}
          onToggle={toggleDarkMode}
        />
        
        <SettingItem
          icon="event-available"
          title="Available for Appointments"
          description="Allow patients to book appointments with you"
          value={availableForAppointments}
          onToggle={toggleAvailability}
        />
        
        <ButtonItem
          icon="schedule"
          title="Working Hours"
          onPress={() => Alert.alert('Working Hours', 'Set your availability schedule')}
        />
      </Card>

      {/* Support Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Support & Info</Text>
      </View>
      <Card containerStyle={styles.card}>
        <ButtonItem
          icon="help-outline"
          title="Help & Support"
          onPress={() => Alert.alert('Help', 'Navigate to help screen')}
        />
        
        <ButtonItem
          icon="info-outline"
          title="About"
          onPress={() => Alert.alert('About', 'App version information')}
        />
        
        <ButtonItem
          icon="policy"
          title="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'View privacy policy')}
        />
        
        <ButtonItem
          icon="description"
          title="Terms of Service"
          onPress={() => Alert.alert('Terms', 'View terms of service')}
        />
      </Card>

      {/* Danger Zone Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
      </View>
      <Card containerStyle={styles.card}>
        <DangerItem
          icon="delete"
          title="Delete Account"
          onPress={() => Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive' }
            ]
          )}
        />
        
        <DangerItem
          icon="logout"
          title="Logout"
          onPress={handleLogout}
        />
      </Card>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  card: {
    borderRadius: 8,
    marginBottom: 15,
    padding: 0,
  },
  profileSection: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.grey,
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.grey,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    color: Colors.grey,
    fontSize: 12,
    marginVertical: 20,
  },
});

export default DoctorSettingsScreen;
