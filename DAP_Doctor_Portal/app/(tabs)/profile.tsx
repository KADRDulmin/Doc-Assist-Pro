import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, Card, Avatar, Button, ActivityIndicator, TextInput, HelperText, Portal, Dialog } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';
import doctorService, { DashboardData } from '../../services/doctorService';
import Colors from '../../constants/Colors';
import { LocationSelector, LocationData } from '../../components/maps';

// Profile validation schema
const ProfileSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  phone: Yup.string(),
  specialization: Yup.string().required('Specialization is required'),
  license_number: Yup.string().required('License number is required'),
  years_of_experience: Yup.number()
    .min(0, 'Experience cannot be negative')
    .required('Years of experience is required'),
  education: Yup.string(),
  bio: Yup.string(),
  consultation_fee: Yup.number()
    .min(0, 'Fee cannot be negative')
    .required('Consultation fee is required'),
  location: Yup.object().shape({
    latitude: Yup.number(),
    longitude: Yup.number(),
    address: Yup.string()
  })
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | undefined>(undefined);

  // Load doctor profile data
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      const response = await doctorService.getProfile(token);
      
      if (response.success && response.data) {
        // Check if location data exists
        let location: LocationData | undefined;
        if (response.data.latitude && response.data.longitude) {
          location = {
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            address: response.data.address || ''
          };
          setLocationData(location);
        }
        
        setProfileData({
          ...response.data,
          // Include user details
          first_name: response.data.user?.first_name || '',
          last_name: response.data.user?.last_name || '',
          email: response.data.user?.email || '',
          phone: response.data.user?.phone || '',
          location: location
        });
      } else {
        setError(response.error || 'Failed to load profile data');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (values: any) => {
    try {
      setUpdating(true);
      setError(null);
      
      const token = await authService.getToken();
      
      if (!token) {
        setError('Authentication token not found');
        return;
      }
      
      // Separate user data from profile data
      const { first_name, last_name, phone, email, location, ...profileUpdateData } = values;
      
      // If location exists, add it to profileUpdateData
      if (location) {
        profileUpdateData.latitude = location.latitude;
        profileUpdateData.longitude = location.longitude;
        profileUpdateData.address = location.address;
      }
      
      // Update profile data
      const response = await doctorService.updateProfile(profileUpdateData, token);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Your profile has been updated successfully.',
          [{ text: 'OK' }]
        );
        
        setProfileData({
          ...response.data,
          first_name,
          last_name,
          email,
          phone,
          location
        });
        
        setIsEditing(false);
      } else {
        setError(response.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutDialogVisible(false);
    await signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={loadProfile} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        )}

        {profileData && (
          <>
            <Card style={styles.profileHeader}>
              <Card.Content style={styles.profileHeaderContent}>
                <Avatar.Text 
                  label={`${profileData.first_name?.charAt(0)}${profileData.last_name?.charAt(0)}`}
                  size={80}
                  style={styles.avatar}
                />
                <View style={styles.profileHeaderInfo}>
                  <Text style={styles.doctorName}>Dr. {profileData.first_name} {profileData.last_name}</Text>
                  <Text style={styles.doctorSpecialty}>{profileData.specialization}</Text>
                  <Text style={styles.doctorExperience}>
                    {profileData.years_of_experience} years of experience
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Formik
              initialValues={{
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                email: profileData.email || '',
                phone: profileData.phone || '',
                specialization: profileData.specialization || '',
                license_number: profileData.license_number || '',
                years_of_experience: profileData.years_of_experience?.toString() || '0',
                education: profileData.education || '',
                bio: profileData.bio || '',
                consultation_fee: profileData.consultation_fee?.toString() || '0',
                location: profileData.location
              }}
              validationSchema={ProfileSchema}
              onSubmit={handleUpdateProfile}
              enableReinitialize
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
              }) => (
                <View style={styles.profileForm}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    {!isEditing && (
                      <Button
                        mode="outlined"
                        onPress={() => setIsEditing(true)}
                        style={styles.editButton}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </View>

                  <Card style={styles.formCard}>
                    <Card.Content>
                      <TextInput
                        label="First Name"
                        value={values.first_name}
                        onChangeText={handleChange('first_name')}
                        onBlur={handleBlur('first_name')}
                        style={styles.input}
                        disabled={!isEditing}
                        error={touched.first_name && !!errors.first_name}
                      />
                      {touched.first_name && errors.first_name && (
                        <HelperText type="error">{errors.first_name}</HelperText>
                      )}

                      <TextInput
                        label="Last Name"
                        value={values.last_name}
                        onChangeText={handleChange('last_name')}
                        onBlur={handleBlur('last_name')}
                        style={styles.input}
                        disabled={!isEditing}
                        error={touched.last_name && !!errors.last_name}
                      />
                      {touched.last_name && errors.last_name && (
                        <HelperText type="error">{errors.last_name}</HelperText>
                      )}

                      <TextInput
                        label="Email"
                        value={values.email}
                        style={styles.input}
                        disabled={true} // Email should not be editable
                      />

                      <TextInput
                        label="Phone Number"
                        value={values.phone}
                        onChangeText={handleChange('phone')}
                        onBlur={handleBlur('phone')}
                        style={styles.input}
                        disabled={!isEditing}
                        keyboardType="phone-pad"
                      />
                    </Card.Content>
                  </Card>

                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Professional Information</Text>
                  <Card style={styles.formCard}>
                    <Card.Content>
                      <TextInput
                        label="Specialization"
                        value={values.specialization}
                        onChangeText={handleChange('specialization')}
                        onBlur={handleBlur('specialization')}
                        style={styles.input}
                        disabled={!isEditing}
                        error={touched.specialization && !!errors.specialization}
                      />
                      {touched.specialization && errors.specialization && (
                        <HelperText type="error">{errors.specialization}</HelperText>
                      )}

                      <TextInput
                        label="License Number"
                        value={values.license_number}
                        onChangeText={handleChange('license_number')}
                        onBlur={handleBlur('license_number')}
                        style={styles.input}
                        disabled={!isEditing}
                        error={touched.license_number && !!errors.license_number}
                      />
                      {touched.license_number && errors.license_number && (
                        <HelperText type="error">{errors.license_number}</HelperText>
                      )}

                      <TextInput
                        label="Years of Experience"
                        value={values.years_of_experience}
                        onChangeText={text => setFieldValue('years_of_experience', text)}
                        onBlur={handleBlur('years_of_experience')}
                        style={styles.input}
                        disabled={!isEditing}
                        keyboardType="numeric"
                        error={touched.years_of_experience && !!errors.years_of_experience}
                      />
                      {touched.years_of_experience && errors.years_of_experience && (
                        <HelperText type="error">{errors.years_of_experience}</HelperText>
                      )}

                      <TextInput
                        label="Education"
                        value={values.education}
                        onChangeText={handleChange('education')}
                        onBlur={handleBlur('education')}
                        style={styles.input}
                        disabled={!isEditing}
                        multiline
                      />

                      <TextInput
                        label="Bio"
                        value={values.bio}
                        onChangeText={handleChange('bio')}
                        onBlur={handleBlur('bio')}
                        style={styles.input}
                        disabled={!isEditing}
                        multiline
                        numberOfLines={3}
                      />

                      <TextInput
                        label="Consultation Fee"
                        value={values.consultation_fee}
                        onChangeText={text => setFieldValue('consultation_fee', text)}
                        onBlur={handleBlur('consultation_fee')}
                        style={styles.input}
                        disabled={!isEditing}
                        keyboardType="numeric"
                        error={touched.consultation_fee && !!errors.consultation_fee}
                      />
                      {touched.consultation_fee && errors.consultation_fee && (
                        <HelperText type="error">{errors.consultation_fee}</HelperText>
                      )}
                    </Card.Content>
                  </Card>
                  
                  <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Practice Location</Text>
                  <Card style={styles.formCard}>
                    <Card.Content>
                      {isEditing ? (
                        <LocationSelector
                          initialLocation={values.location}
                          onLocationSelected={(location) => setFieldValue('location', location)}
                          label="Practice Location"
                          required={false}
                        />
                      ) : (
                        values.location ? (
                          <View>
                            <Text style={styles.addressText}>{values.location.address}</Text>
                            <View style={styles.staticMapContainer}>
                              <LocationSelector
                                initialLocation={values.location}
                                editable={false}
                                onLocationSelected={() => {}}
                              />
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.noLocationText}>
                            No practice location set. Edit your profile to add your location.
                          </Text>
                        )
                      )}
                    </Card.Content>
                  </Card>

                  {isEditing && (
                    <View style={styles.actionButtons}>
                      <Button
                        mode="outlined"
                        onPress={() => setIsEditing(false)}
                        style={[styles.actionButton, styles.cancelButton]}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleSubmit()}
                        style={styles.actionButton}
                        disabled={updating}
                        loading={updating}
                      >
                        Save Changes
                      </Button>
                    </View>
                  )}
                </View>
              )}
            </Formik>

            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Log Out
            </Button>
          </>
        )}

        <Portal>
          <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
            <Dialog.Title>Confirm Logout</Dialog.Title>
            <Dialog.Content>
              <Text>Are you sure you want to log out from Doc-Assist Pro?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
              <Button onPress={confirmLogout}>Log Out</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
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
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    width: 150,
  },
  profileHeader: {
    marginBottom: 20,
    elevation: 2,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    backgroundColor: Colors.light.primary,
  },
  profileHeaderInfo: {
    marginLeft: 20,
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  doctorSpecialty: {
    fontSize: 16,
    marginBottom: 3,
    color: '#555',
  },
  doctorExperience: {
    fontSize: 14,
    color: '#666',
  },
  profileForm: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  editButton: {
    borderColor: Colors.light.primary,
  },
  formCard: {
    elevation: 2,
    marginBottom: 10,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderColor: '#ccc',
  },
  logoutButton: {
    marginTop: 30,
    borderColor: '#F44336',
    borderWidth: 1,
  },
  staticMapContainer: {
    height: 200,
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  addressText: {
    fontSize: 16,
    color: '#555',
  },
  noLocationText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});