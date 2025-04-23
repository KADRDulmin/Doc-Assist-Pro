import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  TextInput,
  Alert
} from 'react-native';
import { Card } from 'react-native-elements';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../contexts/AuthContext';
import { getDoctorProfile, updateDoctorProfile } from '../../services/doctorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Colors from '../../constants/Colors';

const ProfileImage = require('../../../assets/images/doctor-profile.png');

const DoctorProfileScreen = () => {
  const { userInfo } = useContext(AuthContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [education, setEducation] = useState('');
  const [bio, setBio] = useState('');
  const [consultationFee, setConsultationFee] = useState('');

  const specializations = [
    'Cardiology', 
    'Dermatology', 
    'Endocrinology',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery',
    'Urology',
    'General Medicine',
    'Orthopedics',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Dental'
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = await getDoctorProfile();
      setProfile(profileData);
      
      // Initialize editable fields with current values
      if (profileData) {
        setFirstName(profileData.user?.first_name || '');
        setLastName(profileData.user?.last_name || '');
        setPhone(profileData.user?.phone || '');
        setSpecialization(profileData.specialization || '');
        setYearsOfExperience(profileData.years_of_experience?.toString() || '');
        setEducation(profileData.education || '');
        setBio(profileData.bio || '');
        setConsultationFee(profileData.consultation_fee?.toString() || '');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateFields()) return;

    setIsSaving(true);
    try {
      await updateDoctorProfile({
        specialization,
        years_of_experience: yearsOfExperience ? parseInt(yearsOfExperience) : 0,
        education,
        bio,
        consultation_fee: consultationFee ? parseFloat(consultationFee) : 0,
      });

      // Refresh profile data
      await loadProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const validateFields = () => {
    if (!specialization) {
      Alert.alert('Error', 'Specialization is required');
      return false;
    }
    return true;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image source={ProfileImage} style={styles.profileImage} />
        <Text style={styles.doctorName}>Dr. {firstName} {lastName}</Text>
        <Text style={styles.doctorSpecialization}>{profile?.specialization}</Text>
        <Text style={styles.doctorLicense}>License: {profile?.license_number}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isEditing ? (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <MaterialIcons name="edit" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditing(false);
                loadProfile(); // Reset form data
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <LoadingSpinner color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Details */}
      <Card containerStyle={styles.detailsCard}>
        <Card.Title>Personal Information</Card.Title>
        <Card.Divider />

        {/* Profile fields - show as form when editing, otherwise show as display */}
        {!isEditing ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{profile?.user?.email || userInfo?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{profile?.user?.phone || 'Not provided'}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First Name"
              editable={false} // Names should be updated in account settings
            />
            
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last Name"
              editable={false} // Names should be updated in account settings
            />
            
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              editable={false} // Phone should be updated in account settings
            />
          </>
        )}
      </Card>

      {/* Professional Details */}
      <Card containerStyle={styles.detailsCard}>
        <Card.Title>Professional Information</Card.Title>
        <Card.Divider />

        {!isEditing ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialization:</Text>
              <Text style={styles.infoValue}>{profile?.specialization || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Experience:</Text>
              <Text style={styles.infoValue}>
                {profile?.years_of_experience ? `${profile.years_of_experience} years` : 'Not specified'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Education:</Text>
              <Text style={styles.infoValue}>{profile?.education || 'Not specified'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Consultation Fee:</Text>
              <Text style={styles.infoValue}>
                {profile?.consultation_fee ? `$${profile.consultation_fee}` : 'Not specified'}
              </Text>
            </View>
            <View style={styles.bioSection}>
              <Text style={styles.infoLabel}>Bio:</Text>
              <Text style={styles.bioText}>{profile?.bio || 'No bio provided'}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>Specialization</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={specialization}
                onValueChange={(value) => setSpecialization(value)}
                style={styles.picker}
              >
                <Picker.Item label="Select Specialization" value="" />
                {specializations.map((item, index) => (
                  <Picker.Item key={index} label={item} value={item} />
                ))}
              </Picker>
            </View>
            
            <Text style={styles.inputLabel}>Years of Experience</Text>
            <TextInput
              style={styles.input}
              value={yearsOfExperience}
              onChangeText={setYearsOfExperience}
              placeholder="Years of Experience"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Education</Text>
            <TextInput
              style={styles.input}
              value={education}
              onChangeText={setEducation}
              placeholder="Education (e.g., MD, PhD)"
            />
            
            <Text style={styles.inputLabel}>Consultation Fee</Text>
            <TextInput
              style={styles.input}
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="Consultation Fee"
              keyboardType="numeric"
            />
            
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself and your medical practice"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.grey,
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  doctorName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },
  doctorSpecialization: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 5,
  },
  doctorLicense: {
    fontSize: 14,
    color: Colors.grey,
    marginTop: 5,
  },
  actionButtons: {
    padding: 15,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 5,
  },
  editActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
  detailsCard: {
    borderRadius: 8,
    marginBottom: 15,
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.grey,
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
    color: Colors.text,
  },
  bioSection: {
    marginTop: 10,
  },
  bioText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
    lineHeight: 22,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    height: 50,
  },
});

export default DoctorProfileScreen;
