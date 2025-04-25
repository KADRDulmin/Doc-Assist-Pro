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
      id: 'settings',
      title: 'Settings',
      icon: <Feather name="settings" size={24} color={colorScheme === 'dark' ? '#fff' : '#333'} />,
      onPress: () => router.push('/settings')
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
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons 
                name="calendar" 
                size={24} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
              <ThemedText style={styles.sectionTitle}>Upcoming Appointments</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButtonContainer} 
              onPress={() => router.push('/appointments')}
            >
              <ThemedText style={styles.seeAllButtonText}>See All</ThemedText>
              <Feather 
                name="chevron-right" 
                size={16} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.appointmentsArea}>
            {upcomingAppointments.length === 0 ? (
              <ThemedView style={styles.emptyStateContainer}>
                <Ionicons 
                  name="calendar-outline" 
                  size={40} 
                  color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                />
                <ThemedText style={styles.emptyStateText}>No upcoming appointments</ThemedText>
                <TouchableOpacity 
                  style={[
                    styles.emptyStateButton,
                    { backgroundColor: colorScheme === 'dark' ? '#1a8fc1' : '#0a7ea4' }
                  ]}
                  onPress={() => router.push('/new-appointment')}
                >
                  <ThemedText style={styles.emptyStateButtonText}>Schedule Now</ThemedText>
                </TouchableOpacity>
              </ThemedView>
            ) : (
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.appointmentsScrollContent}
                decelerationRate="fast"
                snapToInterval={260} // Width of card + margin
                snapToAlignment="start"
              >
                {upcomingAppointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.id}
                    style={[
                      styles.appointmentCard,
                      { 
                        backgroundColor: colorScheme === 'dark' ? '#172C36' : '#fff',
                        borderLeftWidth: 4,
                        borderLeftColor: appointment.status === 'confirmed' ? '#2ecc71' : '#f39c12'
                      }
                    ]}
                    onPress={() => router.push(`/appointments/${appointment.id}`)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.appointmentCardHeader}>
                      <View style={styles.appointmentDateContainer}>
                        <ThemedText style={[styles.appointmentDateText, colorScheme === 'dark' && { color: '#fff' }]}>
                          {appointment.date}
                        </ThemedText>
                        <ThemedText style={[styles.appointmentTimeText, colorScheme === 'dark' && { color: '#a0a0a0' }]}>
                          {appointment.time}
                        </ThemedText>
                      </View>
                      
                      <View style={[
                        styles.appointmentStatusBadge,
                        appointment.status === 'confirmed' ? 
                          (colorScheme === 'dark' ? styles.confirmedBadgeDark : styles.confirmedBadgeLight) : 
                          (colorScheme === 'dark' ? styles.pendingBadgeDark : styles.pendingBadgeLight)
                      ]}>
                        <ThemedText style={[
                          styles.appointmentStatusText,
                          appointment.status === 'confirmed' ? styles.confirmedText : styles.pendingText
                        ]}>
                          {appointment.status}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={[
                      styles.appointmentDivider,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]} />
                    
                    <View style={styles.appointmentCardBody}>
                      <View style={styles.doctorAvatarContainer}>
                        <View style={[
                          styles.doctorAvatarCircle,
                          { backgroundColor: colorScheme === 'dark' ? '#203A43' : '#E0EAFC' }
                        ]}>
                          <Ionicons 
                            name="person" 
                            size={22} 
                            color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                          />
                        </View>
                      </View>
                      
                      <View style={styles.appointmentDetails}>
                        <ThemedText style={[styles.doctorNameText, colorScheme === 'dark' && { color: '#fff' }]}>
                          {appointment.doctor}
                        </ThemedText>
                        <View style={styles.specialtyContainer}>
                          <Ionicons 
                            name="medical" 
                            size={12} 
                            color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                          />
                          <ThemedText style={[
                            styles.doctorSpecialtyText, 
                            colorScheme === 'dark' && { color: '#a0a0a0' }
                          ]}>
                            {appointment.specialty}
                          </ThemedText>
                        </View>
                        <View style={[
                          styles.appointmentTypeContainer,
                          { backgroundColor: colorScheme === 'dark' ? 'rgba(161, 206, 220, 0.15)' : 'rgba(10, 126, 164, 0.1)' }  
                        ]}>
                          <ThemedText style={[
                            styles.appointmentTypeText,
                            { color: colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4' }
                          ]}>
                            {appointment.type}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[
                    styles.newAppointmentCard,
                    { backgroundColor: colorScheme === 'dark' ? '#1a8fc1' : '#4fb6e0' }
                  ]}
                  onPress={() => router.push('/new-appointment')}
                  activeOpacity={0.8}
                >
                  <View style={styles.newAppointmentContent}>
                    <View style={styles.newAppointmentIconContainer}>
                      <Ionicons name="add-circle" size={36} color="#fff" />
                    </View>
                    <ThemedText style={styles.newAppointmentText}>
                      Schedule New{'\n'}Appointment
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Nearby Doctors */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons 
                name="people" 
                size={24} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
              <ThemedText style={styles.sectionTitle}>Nearby Doctors</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButtonContainer} 
              onPress={() => router.push('/doctors')}
            >
              <ThemedText style={styles.seeAllButtonText}>See All</ThemedText>
              <Feather 
                name="chevron-right" 
                size={16} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.doctorsScrollContent}
            decelerationRate="fast"
            snapToInterval={200} // Width of card + margin
            snapToAlignment="start"
          >
            {nearbyDoctors.map((doctor) => (
              <TouchableOpacity
                key={doctor.id}
                style={[
                  styles.doctorCard,
                  { backgroundColor: colorScheme === 'dark' ? '#1D2B34' : '#fff' }
                ]}
                onPress={() => router.push(`/doctors/${doctor.id}`)}
                activeOpacity={0.9}
              >
                <View style={styles.doctorImageWrapper}>
                  <LinearGradient
                    colors={colorScheme === 'dark' ? ['#2C5364', '#203A43'] : ['#E0EAFC', '#CFDEF3']}
                    style={styles.doctorImageContainer}
                  >
                    <Ionicons 
                      name="person" 
                      size={38} 
                      color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                    />
                  </LinearGradient>
                  
                  {doctor.availableToday && (
                    <View style={styles.availableBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#fff" />
                      <ThemedText style={styles.availableBadgeText}>Available Today</ThemedText>
                    </View>
                  )}
                </View>
                
                <View style={styles.doctorCardContent}>
                  <ThemedText style={styles.doctorCardName} numberOfLines={1}>{doctor.name}</ThemedText>
                  
                  <View style={styles.doctorSpecialtyRow}>
                    <Ionicons 
                      name="medical" 
                      size={12} 
                      color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                    />
                    <ThemedText style={styles.doctorCardSpecialty} numberOfLines={1}>{doctor.specialty}</ThemedText>
                  </View>
                  
                  <View style={styles.doctorCardFooter}>
                    <View style={[
                      styles.ratingContainer,
                      { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.1)' }
                    ]}>
                      <Ionicons name="star" size={14} color="#FFC107" />
                      <ThemedText style={styles.ratingText}>{doctor.rating}</ThemedText>
                    </View>
                    
                    <View style={styles.distanceContainer}>
                      <Ionicons 
                        name="location" 
                        size={14} 
                        color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
                      />
                      <ThemedText style={styles.distanceText}>{doctor.distance}</ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Health Tips */}
        <View style={[styles.sectionContainer, styles.healthTipsSection]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrapper}>
              <Ionicons 
                name="bulb" 
                size={24} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
              <ThemedText style={styles.sectionTitle}>Health Tips</ThemedText>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButtonContainer} 
              onPress={() => router.push('/health-tips')}
            >
              <ThemedText style={styles.seeAllButtonText}>See All</ThemedText>
              <Feather 
                name="chevron-right" 
                size={16} 
                color={colorScheme === 'dark' ? '#A1CEDC' : '#0a7ea4'} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.healthTipsContainer}>
            {healthTips.map((tip, index) => {
              // Determine gradient colors based on index and color scheme
              let gradientColors;
              if (index % 3 === 0) {
                gradientColors = colorScheme === 'dark' ? 
                  ['#1a8fc1', '#0c5270'] : 
                  ['#4fb6e0', '#0a7ea4'];
              } else if (index % 3 === 1) {
                gradientColors = colorScheme === 'dark' ? 
                  ['#7e57c2', '#5e35b1'] : 
                  ['#9575cd', '#7e57c2'];
              } else {
                gradientColors = colorScheme === 'dark' ? 
                  ['#43a047', '#2e7d32'] : 
                  ['#66bb6a', '#43a047'];
              }

              // Determine icon based on index
              let iconName;
              if (index % 3 === 0) {
                iconName = "nutrition";
              } else if (index % 3 === 1) {
                iconName = "bed";
              } else {
                iconName = "fitness";
              }
              
              return (
                <TouchableOpacity
                  key={tip.id}
                  style={[
                    styles.healthTipCard,
                    index === healthTips.length - 1 ? { marginBottom: 0 } : null
                  ]}
                  onPress={() => router.push(`/health-tips/${tip.id}`)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.healthTipGradient}
                  >
                    <View style={styles.healthTipIconContainer}>
                      <Ionicons name={iconName as any} size={24} color="#fff" />
                    </View>
                    
                    <View style={styles.healthTipContent}>
                      <ThemedText style={styles.healthTipTitle}>{tip.title}</ThemedText>
                      <ThemedText style={styles.healthTipSummary} numberOfLines={2}>{tip.summary}</ThemedText>
                      
                      <View style={styles.healthTipFooter}>
                        <ThemedText style={styles.readMoreButton}>Read More</ThemedText>
                        <Feather name="arrow-right" size={16} color="#fff" />
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
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
  doctorsScrollContent: {
    paddingLeft: 5,
    paddingRight: 25,
    paddingBottom: 15,
    paddingTop: 5,
  },
  doctorCard: {
    width: 180,
    marginRight: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  doctorImageWrapper: {
    position: 'relative',
  },
  doctorImageContainer: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(46, 204, 113, 0.9)',
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  doctorCardContent: {
    padding: 16,
  },
  doctorCardName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  doctorSpecialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  doctorCardSpecialty: {
    fontSize: 13,
    opacity: 0.7,
    marginLeft: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
    color: '#f39c12',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    marginLeft: 4,
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
