import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/src/contexts/AuthContext';
import patientService, { PatientDashboardData } from '@/src/services/patient.service';
import appointmentService, { AppointmentData } from '@/src/services/appointment.service';
import doctorService, { DoctorData } from '@/src/services/doctor.service';
import healthTipService, { HealthTipData } from '@/src/services/healthTip.service';
import geminiService, { HealthTipRecommendation } from '@/src/services/gemini.service';

const windowWidth = Dimensions.get('window').width;

// Define interfaces for all data types
interface UserProfile {
  id: number;
  name: string;
  age: number | null;
  nextAppointment: string | null;
}

interface MedicalRecord {
  id: number;
  type: string;
  title: string;
  date: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  isNew: boolean;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}

export default function HomeScreen() {
  const { logout, isLoading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardData, setDashboardData] = useState<PatientDashboardData | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentData[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [healthTips, setHealthTips] = useState<HealthTipRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [personalizedTipsLoading, setPersonalizedTipsLoading] = useState(false);
  
  // Sidebar Animation States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Load data from API
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load patient profile
      const profileResponse = await patientService.getMyProfile();
      if (profileResponse.success && profileResponse.data) {
        const profile = profileResponse.data;
        
        // Calculate age if date_of_birth exists
        let age = null;
        if (profile.date_of_birth) {
          const birthDate = new Date(profile.date_of_birth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          
          // Adjust age if birthday hasn't occurred yet this year
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }
        
        setUserProfile({
          id: profile.user_id,
          name: `${profile.user?.first_name || ''} ${profile.user?.last_name || ''}`.trim(),
          age,
          nextAppointment: null // Will be updated with dashboard data
        });
      }
      
      // Load dashboard data
      const dashboardResponse = await patientService.getDashboardData();
      if (dashboardResponse.success && dashboardResponse.data) {
        setDashboardData(dashboardResponse.data);
        
        // Update next appointment in user profile
        if (dashboardResponse.data.upcomingAppointment && userProfile) {
          setUserProfile(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              nextAppointment: dashboardResponse.data.upcomingAppointment.appointment_date
            };
          });
        }
      }
      
      // Load upcoming appointments
      const appointmentsResponse = await appointmentService.getMyAppointments('upcoming');
      if (appointmentsResponse.success && appointmentsResponse.data) {
        setUpcomingAppointments(appointmentsResponse.data.slice(0, 5)); // Limit to 5 appointments
      }
      
      // Load medical records
      const medicalRecordsResponse = await patientService.getMedicalRecords();
      if (medicalRecordsResponse.success && medicalRecordsResponse.data) {
        // Transform to expected format
        const formattedRecords = medicalRecordsResponse.data.map(record => ({
          id: record.id,
          type: record.type || 'Medical Record',
          title: record.title || 'Medical Document',
          date: new Date(record.created_at).toLocaleDateString()
        }));
        
        setMedicalRecords(formattedRecords.slice(0, 3)); // Limit to 3 records
      }
      
      // Load personalized health tips using Gemini API
      await loadPersonalizedHealthTips();
      
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load your data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load personalized health tips based on appointments
  const loadPersonalizedHealthTips = async () => {
    setPersonalizedTipsLoading(true);
    try {
      // Get all appointments to extract doctor specialties
      const allAppointmentsResponse = await appointmentService.getMyAppointments();
      
      if (allAppointmentsResponse.success && allAppointmentsResponse.data) {
        // Extract unique doctor specialties from appointments
        const specialties = allAppointmentsResponse.data
          .filter(appointment => appointment.doctor?.specialization)
          .map(appointment => appointment.doctor?.specialization as string);
          
        // Remove duplicates
        const uniqueSpecialties = [...new Set(specialties)];
        
        // Get patient medical conditions if available
        const profileResponse = await patientService.getMyProfile();
        const medicalHistory = profileResponse.success && profileResponse.data?.medical_history 
          ? profileResponse.data.medical_history 
          : '';
          
        // Generate personalized health tips
        const tipsResponse = await geminiService.getPersonalizedHealthTips(uniqueSpecialties, medicalHistory);
        
        if (tipsResponse.success && tipsResponse.data) {
          setHealthTips(tipsResponse.data);
        } else {
          // Fallback to default tips if API call fails
          setHealthTips([
            {
              id: 'default-1',
              title: 'Healthy Eating Habits',
              summary: 'Learn how small diet changes can improve your overall health and energy levels.',
              category: 'Nutrition',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-2',
              title: 'Importance of Sleep',
              summary: 'Discover why quality sleep is crucial for your physical and mental wellbeing.',
              category: 'Wellness',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-3',
              title: 'Stress Management',
              summary: 'Effective techniques to manage stress in your daily life.',
              category: 'Mental Health',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to load personalized health tips:', err);
      // Keep using fallback data in case of error
      setHealthTips([
        {
          id: 'default-1',
          title: 'Healthy Eating Habits',
          summary: 'Learn how small diet changes can improve your overall health and energy levels.',
          category: 'Nutrition',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'default-2',
          title: 'Importance of Sleep',
          summary: 'Discover why quality sleep is crucial for your physical and mental wellbeing.',
          category: 'Wellness',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'default-3',
          title: 'Stress Management',
          summary: 'Effective techniques to manage stress in your daily life.',
          category: 'Mental Health',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setPersonalizedTipsLoading(false);
    }
  };

  // Animation functions for sidebar
  const toggleSidebar = () => {
    if (sidebarOpen) {
      // Close sidebar
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => setSidebarOpen(false));
    } else {
      // Open sidebar
      setSidebarOpen(true);
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  // Sidebar translation
  const sidebarTranslateX = sidebarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 0]
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);
  
  const handleAppointmentPress = (appointmentId: number) => {
    router.push({ pathname: `/appointments/${appointmentId}` });
  };

  const handleMedicalRecordPress = (recordId: number) => {
    router.push({ pathname: `/medical-records/${recordId}` });
  };
  
  // Function to handle health tip press and navigate to detail page
  const handleHealthTipPress = (tip: HealthTipRecommendation) => {
    router.push({
      pathname: '/health-tips/[id]', // Updated to health-tips plural to match existing routes
      params: {
        id: tip.id,
        title: tip.title,
        category: tip.category
      }
    });
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Logout Error', 'Failed to logout properly. Please try again.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Menu items for the sidebar
  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      title: 'My Profile',
      icon: <Feather name="user" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push({ pathname: '/profile' })
    },
    {
      id: 'appointments',
      title: 'My Appointments',
      icon: <Feather name="calendar" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push({ pathname: '/appointments' })
    },
    {
      id: 'medical-records',
      title: 'Medical Records',
      icon: <Feather name="file-text" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push({ pathname: '/medical-records' })
    }
  ];

  type CardType = 'new' | 'followup' | 'checkup' | 'default';

  const getActionCardGradient = (type: CardType): [string, string] => {
    switch (type) {
      case 'new':
        return colorScheme === 'dark' 
          ? ['#1a6085', '#0c3b53'] as [string, string]
          : ['#4fb6e0', '#2e8cb8'] as [string, string];
      case 'followup':
        return colorScheme === 'dark'
          ? ['#635985', '#443c5c'] as [string, string]
          : ['#9f84bd', '#7a63a4'] as [string, string];
      case 'checkup':
        return colorScheme === 'dark'
          ? ['#3f7855', '#20452f'] as [string, string]
          : ['#6abf8a', '#4b9c69'] as [string, string];
      default:
        return colorScheme === 'dark'
          ? ['#444', '#222'] as [string, string]
          : ['#ddd', '#bbb'] as [string, string];
    }
  };

  // Define fixed gradient colors as const tuples to satisfy LinearGradient requirements
  const headerGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const headerGradientLight = ['#A1CEDC', '#78b1c4'] as const;
  
  const sidebarGradientDark = ['#1D3D47', '#0f1e23'] as const;
  const sidebarGradientLight = ['#ffffff', '#f7f7f7'] as const;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
        <ThemedText style={{ marginTop: 20 }}>Loading your data...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colorScheme === 'dark' ? '#1D3D47' : '#A1CEDC'}
      />
      
      {/* Backdrop when sidebar is open */}
      {sidebarOpen && (
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: backdropOpacity }
          ]}
          onTouchEnd={toggleSidebar}
        />
      )}

      {/* Sidebar Menu */}
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarTranslateX }] },
          colorScheme === 'dark' ? styles.sidebarDark : styles.sidebarLight
        ]}
      >
        <LinearGradient
          colors={colorScheme === 'dark' ? sidebarGradientDark : sidebarGradientLight}
          style={styles.sidebarGradient}
        >
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarProfileContainer}>
              <View style={styles.sidebarProfileImage}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              <View style={styles.sidebarProfileInfo}>
                <ThemedText style={styles.sidebarProfileName}>{userProfile?.name || 'Patient'}</ThemedText>
                <View style={styles.sidebarProfileBadge}>
                  <ThemedText style={styles.sidebarProfileBadgeText}>Patient</ThemedText>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.sidebarContent}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.sidebarMenuItem}
                onPress={item.onPress}
              >
                <View style={styles.sidebarMenuItemIcon}>{item.icon}</View>
                <ThemedText style={styles.sidebarMenuItemText}>{item.title}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.sidebarLogoutButton}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={22} color="#e53935" />
            <ThemedText style={styles.sidebarLogoutText}>
              Logout
            </ThemedText>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>

      {/* Main Dashboard Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={colorScheme === 'dark' ? headerGradientDark : headerGradientLight}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Feather name="menu" size={26} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <ThemedText style={styles.greetingText}>Hello, {userProfile?.name?.split(' ')[0] || 'there'}</ThemedText>
              <ThemedText style={styles.subGreeting}>
                How are you feeling today?
              </ThemedText>
              
              {userProfile?.nextAppointment && (
                <View style={styles.nextAppointment}>
                  <Ionicons name="calendar-outline" size={12} color="#fff" />
                  <ThemedText style={styles.nextAppointmentText}>
                    Next appointment: {userProfile.nextAppointment}
                  </ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <ThemedText style={{ color: '#fff', fontSize: 12 }}>
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Dashboard Greeting Card */}
        <ThemedView style={styles.dashboardGreeting}>
          <View style={styles.dashboardGreetingContent}>
            <Ionicons name="sunny-outline" size={24} color={colorScheme === 'dark' ? '#FDB813' : '#FF9800'} />
            <ThemedText style={styles.dashboardGreetingText}>
              {userProfile?.age ? `Take care of your health at ${userProfile.age}. Your well-being is our priority.` : 
                'Take care of your health. Your well-being is our priority.'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Quick Statistics */}
        <View style={styles.statsContainer}>
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              <Ionicons name="calendar-outline" size={22} color="#4CAF50" />
            </View>
            <ThemedText style={styles.statsLabel}>Upcoming</ThemedText>
            <ThemedText style={styles.statsValue}>{dashboardData?.appointmentsCount?.upcoming || 0}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#2196F3" />
            </View>
            <ThemedText style={styles.statsLabel}>Completed</ThemedText>
            <ThemedText style={styles.statsValue}>{dashboardData?.appointmentsCount?.completed || 0}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
              <Ionicons name="documents-outline" size={22} color="#FF9800" />
            </View>
            <ThemedText style={styles.statsLabel}>Records</ThemedText>
            <ThemedText style={styles.statsValue}>{dashboardData?.medicalRecordsCount || 0}</ThemedText>
          </ThemedView>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons name="calendar" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.sectionTitle}>Upcoming Appointments</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButtonContainer}
              onPress={() => router.push({ pathname: '/appointments' })}
            >
              <ThemedText style={styles.seeAllButtonText}>See All</ThemedText>
              <Feather name="chevron-right" size={16} color="#0a7ea4" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.appointmentsScrollContent}
            decelerationRate="fast"
          >
            {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment) => (
              <TouchableOpacity 
                key={appointment.id} 
                onPress={() => handleAppointmentPress(appointment.id)}
                style={styles.appointmentCard}
              >
                <View style={styles.appointmentCardHeader}>
                  <View style={styles.appointmentDateContainer}>
                    <ThemedText style={styles.appointmentDateText}>
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </ThemedText>
                    <ThemedText style={styles.appointmentTimeText}>
                      {appointment.appointment_time}
                    </ThemedText>
                  </View>
                  <View 
                    style={[
                      styles.appointmentStatusBadge,
                      colorScheme === 'dark' ? styles.confirmedBadgeDark : styles.confirmedBadgeLight
                    ]}
                  >
                    <ThemedText style={[styles.appointmentStatusText, styles.confirmedText]}>
                      {appointment.status}
                    </ThemedText>
                  </View>
                </View>
                
                <View 
                  style={[
                    styles.appointmentDivider, 
                    { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } 
                  ]}
                />
                
                <View style={styles.appointmentCardBody}>
                  <View style={styles.doctorAvatarContainer}>
                    <View style={[
                      styles.doctorAvatarCircle, 
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(161, 206, 220, 0.1)' : 'rgba(10, 126, 164, 0.1)' }
                    ]}>
                      <Ionicons 
                        name="person" 
                        size={24} 
                        color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                      />
                    </View>
                  </View>
                  
                  <View style={styles.appointmentDetails}>
                    <ThemedText style={styles.doctorNameText}>
                      {appointment.doctor?.user?.first_name && appointment.doctor?.user?.last_name
                        ? `Dr. ${appointment.doctor.user.first_name} ${appointment.doctor.user.last_name}`
                        : 'Doctor'
                      }
                    </ThemedText>
                    
                    <View style={styles.specialtyContainer}>
                      <FontAwesome5 name="stethoscope" size={12} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                      <ThemedText style={styles.doctorSpecialtyText}>
                        {appointment.doctor?.specialization || 'Specialist'}
                      </ThemedText>
                    </View>
                    
                    <View 
                      style={[
                        styles.appointmentTypeContainer,
                        { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                      ]}
                    >
                      <ThemedText style={styles.appointmentTypeText}>
                        {appointment.appointment_type}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )) : (
              <TouchableOpacity
                style={styles.newAppointmentCard}
                onPress={() => router.push({ pathname: '/new-appointment' })}
              >
                <LinearGradient
                  colors={getActionCardGradient('new')}
                  style={styles.newAppointmentContent}
                >
                  <View style={styles.newAppointmentIconContainer}>
                    <Ionicons name="add-circle" size={40} color="#fff" />
                  </View>
                  <ThemedText style={styles.newAppointmentText}>
                    Schedule your first appointment
                  </ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.newAppointmentCard}
              onPress={() => router.push({ pathname: '/new-appointment' })}
            >
              <LinearGradient
                colors={getActionCardGradient('new')}
                style={styles.newAppointmentContent}
              >
                <View style={styles.newAppointmentIconContainer}>
                  <Ionicons name="add-circle" size={40} color="#fff" />
                </View>
                <ThemedText style={styles.newAppointmentText}>
                  Schedule new appointment
                </ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Health Tips */}
        <View style={[styles.sectionContainer, styles.healthTipsSection]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons name="bulb" size={22} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText style={styles.sectionTitle}>Health Tips</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButtonContainer}
              onPress={() => router.push({ pathname: '/health-tips' })}
            >
              <ThemedText style={styles.seeAllButtonText}>See All</ThemedText>
              <Feather name="chevron-right" size={16} color="#0a7ea4" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.healthTipsContainer}>
            {healthTips.map((tip) => (
              <TouchableOpacity 
                key={tip.id}
                style={styles.healthTipCard}
                onPress={() => router.push({ pathname: `/health-tips/${tip.id}` })}
              >
                <LinearGradient
                  colors={colorScheme === 'dark' ? 
                    ['#1D3D47', '#2d5a6b'] :
                    ['#78b1c4', '#A1CEDC']
                  }
                  style={styles.healthTipGradient}
                >
                  <View style={styles.healthTipIconContainer}>
                    <Ionicons name="bulb" size={24} color="#fff" />
                  </View>
                  <View style={styles.healthTipContent}>
                    <ThemedText style={styles.healthTipTitle}>{tip.title}</ThemedText>
                    <ThemedText style={styles.healthTipSummary}>{tip.summary}</ThemedText>
                    <View style={styles.healthTipFooter}>
                      <ThemedText style={styles.readMoreButton}>Read more</ThemedText>
                      <Feather name="chevron-right" size={14} color="#fff" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing for bottom tabs */}
        <View style={{ height: 100 }} />

        {/* Version info */}
        <ThemedText style={styles.versionText}>Doc-Assist-Pro v1.0.0</ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
    paddingLeft: 5,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  nextAppointment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  nextAppointmentText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FF4757',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FFD02C',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    fontSize: 9,
    color: '#000',
    fontWeight: 'bold',
  },
  dashboardGreeting: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 15,
    padding: 15,
  },
  dashboardGreetingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardGreetingText: {
    fontSize: 15,
    marginLeft: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  statsCard: {
    width: '31%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 5,
  },
  sectionTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  seeAllButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  seeAllButtonText: {
    color: '#0a7ea4',
    fontWeight: '600',
    marginRight: 3,
  },
  appointmentsArea: {
    marginTop: 5,
  },
  appointmentsScrollContent: {
    paddingLeft: 5,
    paddingRight: 25,
    paddingBottom: 15,
    paddingTop: 5,
  },
  appointmentCard: {
    width: 240,
    marginRight: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  appointmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  appointmentDateContainer: {
    alignItems: 'flex-start',
  },
  appointmentDateText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
  },
  appointmentTimeText: {
    fontSize: 14,
    opacity: 0.7,
  },
  appointmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  confirmedBadgeLight: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  confirmedBadgeDark: {
    backgroundColor: 'rgba(46, 204, 113, 0.25)',
  },
  pendingBadgeLight: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  pendingBadgeDark: {
    backgroundColor: 'rgba(243, 156, 18, 0.25)',
  },
  appointmentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  confirmedText: {
    color: '#27ae60',
  },
  pendingText: {
    color: '#d35400',
  },
  appointmentDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  appointmentCardBody: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
  },
  doctorAvatarContainer: {
    marginRight: 14,
  },
  doctorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentDetails: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  doctorSpecialtyText: {
    fontSize: 13,
    opacity: 0.7,
    marginLeft: 4,
  },
  appointmentTypeContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  appointmentTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newAppointmentCard: {
    width: 240,
    height: 160, // Fixed height to match the screenshot
    marginRight: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  newAppointmentContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  newAppointmentIconContainer: {
    marginBottom: 15,
  },
  newAppointmentText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  healthTipsSection: {
    marginBottom: 20,
  },
  healthTipsContainer: {
    marginTop: 5,
  },
  healthTipCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  healthTipGradient: {
    flexDirection: 'row',
    padding: 18,
  },
  healthTipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthTipContent: {
    flex: 1,
  },
  healthTipTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  healthTipSummary: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  healthTipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreButton: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Platform.OS === 'ios' ? 
      'rgba(255, 255, 255, 0.6)' : 
      '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 10,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 280,
    height: '100%',
    zIndex: 1000,
  },
  sidebarGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
  },
  sidebarDark: {
    backgroundColor: '#1D3D47',
  },
  sidebarLight: {
    backgroundColor: '#ffffff',
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sidebarProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarProfileInfo: {
    marginLeft: 15,
  },
  sidebarProfileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sidebarProfileBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  sidebarProfileBadgeText: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 5,
  },
  sidebarMenuItemIcon: {
    width: 26,
    alignItems: 'center',
    marginRight: 15,
  },
  sidebarMenuItemText: {
    fontSize: 16,
  },
  sidebarLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  sidebarLogoutText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#e53935',
    fontWeight: '600',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  versionText: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.5,
  },
});
