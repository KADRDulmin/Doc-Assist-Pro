import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import Colors from '../constants/Colors';

const Header = ({ navigation, options }) => {
  const { userInfo } = useContext(AuthContext);

  return (
    <View style={styles.header}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
          {navigation.canGoBack() ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={Colors.primary || '#0066cc'} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.headerTitle}>{options?.title || 'Doc-Assist Pro'}</Text>
        </View>
        
        <View style={styles.headerRight}>
          {userInfo?.role === 'doctor' && (
            <View style={styles.roleIndicator}>
              <Text style={styles.roleText}>Doctor</Text>
            </View>
          )}
          {userInfo?.role === 'patient' && (
            <View style={[styles.roleIndicator, styles.patientIndicator]}>
              <Text style={styles.roleText}>Patient</Text>
            </View>
          )}
          {userInfo?.role === 'admin' && (
            <View style={[styles.roleIndicator, styles.adminIndicator]}>
              <Text style={styles.roleText}>Admin</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerContent: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text || '#333333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIndicator: {
    backgroundColor: Colors.secondary || '#00a86b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  patientIndicator: {
    backgroundColor: Colors.primary || '#0066cc',
  },
  adminIndicator: {
    backgroundColor: Colors.tertiary || '#444444',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default Header;
