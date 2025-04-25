import { Tabs } from 'expo-router';
import React, { useState, useRef } from 'react';
import { Platform, View, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabMenuAnimation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Animation functions for FAB menu
  const toggleFabMenu = () => {
    if (fabMenuOpen) {
      // Close fab menu
      Animated.timing(fabMenuAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setFabMenuOpen(false));
    } else {
      // Open fab menu
      setFabMenuOpen(true);
      Animated.timing(fabMenuAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  // FAB menu animations
  const newConsultationScale = fabMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const followUpScale = fabMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const checkupScale = fabMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const fabRotation = fabMenuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  const handleNewConsultation = () => {
    toggleFabMenu();
    router.push('/consultations/new');
  };
  
  const handleFollowUpAppointment = () => {
    toggleFabMenu();
    router.push('/appointments/follow-up');
  };

  const handleCheckUpAppointment = () => {
    toggleFabMenu();
    router.push('/appointments/checkup');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          // Apply safe area padding to the header
          headerStyle: {
            height: 56 + insets.top,
            paddingTop: insets.top,
          },
          // Preserve safe area at the top for all screens
          contentStyle: {
            paddingTop: insets.top,
          },
          tabBarStyle: {
            ...Platform.select({
              ios: {
                position: 'absolute',
                height: 80 + insets.bottom,
                paddingBottom: 20 + insets.bottom,
                borderTopWidth: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                backgroundColor: colorScheme === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
              },
              android: {
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom,
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                elevation: 8,
              },
              default: {
                backgroundColor: Colors[colorScheme ?? 'light'].background,
                height: 60 + insets.bottom,
                paddingBottom: insets.bottom,
              },
            }),
            // Shared styles
            borderTopColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 3,
          },
          tabBarItemStyle: {
            paddingTop: 6,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
          }}
        />
        {/* Create an empty screen for the FAB placeholder */}
        <Tabs.Screen
          name="placeholder"
          options={{
            title: '',
            tabBarIcon: () => <View style={styles.fabPlaceholder} />,
            tabBarButton: () => <View style={styles.fabPlaceholder} />,
          }}
          listeners={{
            tabPress: (e) => {
              // Prevent default action
              e.preventDefault();
            },
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            title: 'Feedback',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />
      </Tabs>

      {/* Floating Action Button and Menu */}
      <View style={[styles.fabContainer, { bottom: 40 + insets.bottom }]}>
        {/* FAB Menu Options */}
        {fabMenuOpen && (
          <View style={styles.fabMenuContainer}>
            <Animated.View 
              style={[
                styles.fabMenuItem,
                { transform: [{ scale: newConsultationScale }] }
              ]}
            >
              <TouchableOpacity
                style={[styles.fabMenuButton, { backgroundColor: '#4fb6e0' }]}
                onPress={handleNewConsultation}
              >
                <FontAwesome5 name="stethoscope" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.fabMenuLabel}>
                <Animated.Text style={styles.fabMenuLabelText}>New Consultation</Animated.Text>
              </View>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.fabMenuItem,
                { transform: [{ scale: followUpScale }] }
              ]}
            >
              <TouchableOpacity
                style={[styles.fabMenuButton, { backgroundColor: '#9f84bd' }]}
                onPress={handleFollowUpAppointment}
              >
                <Ionicons name="calendar-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.fabMenuLabel}>
                <Animated.Text style={styles.fabMenuLabelText}>Follow-up Appointment</Animated.Text>
              </View>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.fabMenuItem,
                { transform: [{ scale: checkupScale }] }
              ]}
            >
              <TouchableOpacity
                style={[styles.fabMenuButton, { backgroundColor: '#6abf8a' }]}
                onPress={handleCheckUpAppointment}
              >
                <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.fabMenuLabel}>
                <Animated.Text style={styles.fabMenuLabelText}>Schedule Check-up</Animated.Text>
              </View>
            </Animated.View>
          </View>
        )}
        
        {/* Main FAB */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colorScheme === 'dark' ? '#1a8fc1' : '#0a7ea4' }]}
          onPress={toggleFabMenu}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
            <AntDesign name="plus" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabPlaceholder: {
    width: 70,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 999,
    alignItems: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: Platform.OS === 'ios' ? 0 : 0, // Add border for better visibility on light backgrounds
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  fabMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  fabMenuLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.95)' : '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  fabMenuLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
  },
});
