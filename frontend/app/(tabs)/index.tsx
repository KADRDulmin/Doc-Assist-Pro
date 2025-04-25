import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  View, 
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  SafeAreaView,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/src/hooks/useAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const windowWidth = Dimensions.get('window').width;

// Define interfaces for all data types
interface UserProfile {
  name: string;
  age: number;
  nextAppointment: string;
}

interface Appointment {
  id: number;
  type: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
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

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  imageUrl?: string;
  distance: string;
  availableToday: boolean;
}

interface HealthTip {
  id: number;
  title: string;
  summary: string;
  imageUrl?: string;
}

export default function HomeScreen() {
  const { logout, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([
    {
      id: 1,
      doctor: 'Dr. Emily Chen',
      specialty: 'Cardiology',
      type: 'Follow-up',
      date: 'Today',
      time: '10:00 AM',
      status: 'confirmed'
    },
    {
      id: 2,
      doctor: 'Dr. Michael Wong',
      specialty: 'General Medicine',
      type: 'Check-up',
      date: 'May 15',
      time: '3:30 PM',
      status: 'pending'
    }
  ]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, title: 'Reminder: Follow-up appointment', message: 'Tomorrow at 10:00 AM', date: 'Today', isNew: true },
    { id: 2, title: 'Test Results Available', message: 'Your blood work results are ready', date: 'Yesterday', isNew: false }
  ]);
  const [nearbyDoctors, setNearbyDoctors] = useState<Doctor[]>([
    {
      id: 1,
      name: 'Dr. Emily Chen',
      specialty: 'Cardiology',
      rating: 4.9,
      distance: '1.2 mi',
      availableToday: true
    },
    {
      id: 2,
      name: 'Dr. James Wilson',
      specialty: 'Pediatrics',
      rating: 4.7,
      distance: '2.5 mi',
      availableToday: true
    },
    {
      id: 3,
      name: 'Dr. Sarah Miller',
      specialty: 'Dermatology',
      rating: 4.8,
      distance: '3.0 mi',
      availableToday: false
    },
    {
      id: 4,
      name: 'Dr. Robert Brown',
      specialty: 'Orthopedics',
      rating: 4.6,
      distance: '3.5 mi',
      availableToday: true
    }
  ]);
  const [healthTips, setHealthTips] = useState<HealthTip[]>([
    {
      id: 1,
      title: 'Healthy Eating Habits',
      summary: 'Learn how small diet changes can improve your overall health and energy levels.',
    },
    {
      id: 2,
      title: 'Importance of Sleep',
      summary: 'Discover why quality sleep is crucial for your physical and mental wellbeing.',
    },
    {
      id: 3,
      title: 'Stress Management',
      summary: 'Effective techniques to manage stress in your daily life.',
    }
  ]);
  
  // Sidebar Animation States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  
  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate loading user profile
    setUserProfile({
      name: 'Sarah Johnson',
      age: 34,
      nextAppointment: 'May 2, 2025'
    });

    // Simulate loading medical records
    setMedicalRecords([
      { id: 1, type: 'Prescription', title: 'Hypertension Medication', date: 'Apr 10, 2025' },
      { id: 2, type: 'Lab Results', title: 'Blood Work Analysis', date: 'Mar 25, 2025' },
      { id: 3, type: 'Medical Note', title: 'Annual Check-up Report', date: 'Feb 15, 2025' }
    ]);
  }, []);

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
    // Replace with actual API calls
    try {
      // await fetchUserProfile();
      // await fetchAppointments();
      // await fetchMedicalRecords();
      setTimeout(() => {
        setRefreshing(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setRefreshing(false);
    }
  }, []);
  
  const handleAppointmentPress = (appointmentId: number) => {
    // Navigate to appointment details
    // router.push(`/appointments/${appointmentId}`);
    Alert.alert('Appointment Details', `Viewing details for appointment #${appointmentId}`);
  };

  const handleMedicalRecordPress = (recordId: number) => {
    // Navigate to medical record details
    // router.push(`/medical-records/${recordId}`);
    Alert.alert('Medical Record', `Viewing details for record #${recordId}`);
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
      onPress: () => router.push('/profile')
    },
    {
      id: 'appointments',
      title: 'My Appointments',
      icon: <Feather name="calendar" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/appointments')
    },
    {
      id: 'medical-records',
      title: 'Medical Records',
      icon: <Feather name="file-text" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/medical-records')
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      icon: <FontAwesome5 name="prescription-bottle-alt" size={22} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/prescriptions')
    },
    {
      id: 'lab-results',
      title: 'Lab Results',
      icon: <FontAwesome5 name="flask" size={22} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/lab-results')
    },
    {
      id: 'messages',
      title: 'Messages',
      icon: <Feather name="message-circle" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/messages')
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Feather name="settings" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/settings')
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <Feather name="help-circle" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/help')
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
                <Ionicons name="person" size={40} color="#fff" />
              </View>
              <View style={styles.sidebarProfileInfo}>
                <ThemedText style={styles.sidebarProfileName}>
                  {userProfile?.name || 'Patient'}
                </ThemedText>
                <View style={styles.sidebarProfileBadge}>
                  <ThemedText style={styles.sidebarProfileBadgeText}>
                    Patient
                  </ThemedText>
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
                <View style={styles.sidebarMenuItemIcon}>
                  {item.icon}
                </View>
                <ThemedText style={styles.sidebarMenuItemText}>
                  {item.title}
                </ThemedText>
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
              <ThemedText type="title" style={styles.greetingText}>
                Hello, {userProfile?.name || 'Patient'}
              </ThemedText>
              <ThemedText style={styles.subGreeting}>
                How are you feeling today?
              </ThemedText>
              {userProfile?.nextAppointment && (
                <View style={styles.nextAppointment}>
                  <Ionicons name="calendar" size={14} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                  <ThemedText style={styles.nextAppointmentText}>
                    Next appointment: {userProfile.nextAppointment}
                  </ThemedText>
                </View>
              )}
            </View>
            
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={30} color="#ccc" />
              </View>
              <TouchableOpacity 
                style={styles.notificationBadge}
                onPress={() => router.push('/notifications')}
              >
                <Ionicons name="notifications" size={18} color="#fff" />
                {notifications.filter(n => n.isNew).length > 0 && (
                  <View style={styles.badgeIndicator}>
                    <ThemedText style={styles.badgeText}>{notifications.filter(n => n.isNew).length}</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Dashboard Greeting Card */}
        <ThemedView style={styles.dashboardGreeting}>
          <View style={styles.dashboardGreetingContent}>
            <Ionicons name="sunny-outline" size={24} color={colorScheme === 'dark' ? '#FDB813' : '#FF9800'} />
            <ThemedText style={styles.dashboardGreetingText}>
              Good morning! Today is April 25, 2025
            </ThemedText>
          </View>
        </ThemedView>

        {/* Quick Statistics */}
        <View style={styles.statsContainer}>
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
              <Ionicons name="pulse" size={22} color="#2ecc71" />
            </View>
            <ThemedText style={styles.statsLabel}>Last Checkup</ThemedText>
            <ThemedText style={styles.statsValue}>Mar 15</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
              <Ionicons name="medkit" size={22} color="#3498db" />
            </View>
            <ThemedText style={styles.statsLabel}>Prescriptions</ThemedText>
            <ThemedText style={styles.statsValue}>5 Active</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statsCard}>
            <View style={[styles.statsIconContainer, { backgroundColor: 'rgba(241, 196, 15, 0.15)' }]}>
              <Ionicons name="calendar" size={22} color="#f1c40f" />
            </View>
            <ThemedText style={styles.statsLabel}>Next Visit</ThemedText>
            <ThemedText style={styles.statsValue}>May 2</ThemedText>
          </ThemedView>
        </View>

        {/* Upcoming Appointments */}
        <ThemedView style={styles.section}>
          <View style={styles.sectionHeaderView}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="calendar" size={20} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
              <ThemedText type="subtitle" style={styles.sectionTitleText}>Upcoming Appointments</ThemedText>
            </View>
            <TouchableOpacity onPress={() => router.push('/appointments')}>
              <ThemedText style={styles.seeAllLink}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <ThemedView style={styles.appointmentsContainer}>
            {upcomingAppointments.length === 0 ? (
              <ThemedView style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={40} color={Colors[colorScheme ?? 'light'].text} />
                <ThemedText style={styles.emptyStateText}>No upcoming appointments</ThemedText>
              </ThemedView>
            ) : (
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appointmentsScrollContent}
              >
                {upcomingAppointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.horizontalAppointmentCard}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                  >
                    <View style={styles.appointmentCardHeaderView}>
                      <View style={styles.appointmentDateContainerView}>
                        <ThemedText style={styles.appointmentDateText}>{appointment.date}</ThemedText>
                        <ThemedText style={styles.appointmentTime}>{appointment.time}</ThemedText>
                      </View>
                      <View style={[
                        styles.appointmentStatusBadgeView,
                        appointment.status === 'confirmed' ? styles.confirmedBadgeStyle : styles.pendingBadgeStyle
                      ]}>
                        <ThemedText style={styles.appointmentStatusTextStyle}>{appointment.status}</ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.appointmentCardBodyView}>
                      <View style={styles.doctorAvatarContainerView}>
                        <Ionicons name="person-circle" size={36} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                      </View>
                      <View style={styles.appointmentDetailsView}>
                        <ThemedText style={styles.doctorName}>{appointment.doctor}</ThemedText>
                        <ThemedText style={styles.doctorSpecialtyText}>{appointment.specialty}</ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={styles.newAppointmentCard}
                  onPress={() => router.push('/new-appointment')}
                >
                  <View style={styles.newAppointmentContent}>
                    <View style={styles.newAppointmentIconContainer}>
                      <Ionicons name="add-circle" size={32} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                    </View>
                    <ThemedText style={styles.newAppointmentText}>New Appointment</ThemedText>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Nearby Doctors */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderView}>
            <ThemedText style={styles.sectionTitleText}>Nearby Doctors</ThemedText>
            <TouchableOpacity onPress={() => router.push('/doctors')}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.doctorsContainer}
          >
            {nearbyDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={styles.doctorCard}
                onPress={() => router.push(`/doctors/${doctor.id}`)}
              >
                <View style={styles.doctorImageContainer}>
                  <Ionicons name="person-circle" size={50} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                  {doctor.availableToday && (
                    <View style={styles.availableBadge}>
                      <ThemedText style={styles.availableBadgeText}>Available Today</ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.doctorCardContent}>
                  <ThemedText style={styles.doctorCardName}>{doctor.name}</ThemedText>
                  <ThemedText style={styles.doctorCardSpecialty}>{doctor.specialty}</ThemedText>
                  
                  <View style={styles.doctorCardFooter}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <ThemedText style={styles.ratingText}>{doctor.rating}</ThemedText>
                    </View>
                    
                    <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={14} color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} />
                      <ThemedText style={styles.distanceText}>{doctor.distance}</ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Health Tips */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderView}>
            <ThemedText style={styles.sectionTitleText}>Health Tips</ThemedText>
            <TouchableOpacity onPress={() => router.push('/health-tips')}>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.healthTipsContainer}>
            {healthTips.map((tip) => (
              <TouchableOpacity
                key={tip.id}
                style={styles.healthTipCard}
                onPress={() => router.push(`/health-tips/${tip.id}`)}
              >
                <LinearGradient
                  colors={colorScheme === 'dark' ? ['#2C3E50', '#1D3D47'] : ['#ECF0F1', '#D6EAF8']}
                  style={styles.healthTipCardGradient}
                >
                  <View style={styles.healthTipContentView}>
                    <ThemedText style={styles.healthTipTitleText}>{tip.title}</ThemedText>
                    <ThemedText style={styles.healthTipSummary}>{tip.summary}</ThemedText>
                    <ThemedText style={styles.readMoreText}>Read More</ThemedText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom spacing for bottom tabs */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Version info */}
      <ThemedText style={styles.versionText}>Doc-Assist-Pro v1.0.0</ThemedText>
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
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 0,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  seeAllLink: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
  seeAllText: {
    color: '#0a7ea4',
    fontWeight: '500',
  },
  appointmentsContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
  },
  appointmentsScrollContent: {
    paddingRight: 15,
  },
  horizontalAppointmentCard: {
    width: 240,
    marginRight: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  appointmentCardHeaderView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDateContainerView: {
    alignItems: 'flex-start',
  },
  appointmentDateText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 13,
    opacity: 0.7,
  },
  appointmentStatusBadgeView: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confirmedBadgeStyle: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  pendingBadgeStyle: {
    backgroundColor: 'rgba(241, 196, 15, 0.15)',
  },
  appointmentStatusTextStyle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  appointmentCardBodyView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatarContainerView: {
    marginRight: 12,
  },
  appointmentDetailsView: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  doctorSpecialtyText: {
    fontSize: 12,
    opacity: 0.7,
  },
  appointmentCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  appointmentLeftSection: {
    marginRight: 16,
    justifyContent: 'center',
  },
  appointmentDateBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentMiddleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentType: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  appointmentRightSection: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 5,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  confirmedStatus: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  pendingStatus: {
    backgroundColor: 'rgba(241, 196, 15, 0.15)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    marginTop: 15,
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  recordsContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  recordIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  recordDetails: {
    flex: 1,
  },
  recordTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 3,
  },
  recordType: {
    fontSize: 13,
    opacity: 0.7,
  },
  recordDateSection: {
    alignItems: 'flex-end',
  },
  recordDate: {
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.7,
  },
  doctorsContainer: {
    paddingLeft: 5,
    paddingRight: 20,
    paddingVertical: 10,
  },
  doctorCard: {
    width: 180,
    marginRight: 15,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  doctorImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 126, 164, 0.05)',
    position: 'relative',
  },
  availableBadge: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(46, 204, 113, 0.85)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  availableBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  doctorCardContent: {
    padding: 12,
  },
  doctorCardName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 5,
  },
  doctorCardSpecialty: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 8,
  },
  doctorCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 3,
    fontWeight: '500',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    marginLeft: 3,
  },
  healthTipsContainer: {
    marginTop: 5,
  },
  healthTipCard: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  healthTipCardGradient: {
    borderRadius: 15,
  },
  healthTipContentView: {
    padding: 18,
  },
  healthTipTitleText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  healthTipSummary: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  readMoreText: {
    color: '#0a7ea4',
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
  newAppointmentCard: {
    width: 240,
    marginRight: 10,
    padding: 15,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newAppointmentContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newAppointmentIconContainer: {
    marginBottom: 10,
  },
  newAppointmentText: {
    fontWeight: '600',
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
