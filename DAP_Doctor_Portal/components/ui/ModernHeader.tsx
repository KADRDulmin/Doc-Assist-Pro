import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  useColorScheme,
  Platform,
  ColorValue
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import Colors, { Gradients } from '../../constants/Colors';
import { useNotifications } from '../../contexts/notificationContext';

type ModernHeaderProps = {
  title?: string;
  showBackButton?: boolean;
  showNotification?: boolean;
  showAvatar?: boolean;
  customRightComponent?: React.ReactNode;
  userName?: string;
};

const ModernHeader: React.FC<ModernHeaderProps> = ({
  title = 'Doc Assist Pro',
  showBackButton = false,
  showNotification = true,
  showAvatar = true,
  customRightComponent,
  userName = 'Dr. ',
}) => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[theme];
  const { unreadCount } = useNotifications();
  
  // Define gradient colors with explicit typing for LinearGradient
  const headerGradient = Gradients[theme].header as readonly [ColorValue, ColorValue];

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const openNotifications = () => {
    router.push('/notifications');
  };

  const openProfile = () => {
    // Implement profile screen navigation
    router.push('/profile');
  };

  return (
    <LinearGradient
      colors={headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.container,
        { paddingTop: insets.top + 10 }
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={goBack}
              activeOpacity={0.7}
            >
              <FontAwesome5 
                name="chevron-left" 
                size={20} 
                color="#fff" 
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
          <View>
            <Text style={styles.title}>{title}</Text>
            {!showBackButton && (
              <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
            )}
          </View>
        </View>
        
        {customRightComponent ? (
          customRightComponent
        ) : (
          <View style={styles.rightSection}>
            {showNotification && (
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={openNotifications}
                activeOpacity={0.7}
              >                <View style={styles.notificationContainer}>
                  <FontAwesome5 
                    name="bell" 
                    size={22} 
                    color="#fff" 
                  />                  {unreadCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount.toString()}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            
            {showAvatar && (
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={openProfile}
                activeOpacity={0.7}
              >                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userName ? userName.split(' ').map(name => name && name[0] ? name[0] : '').join('') : 'U'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 15,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  notificationContainer: {
    position: 'relative',
  },  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF5C5C',
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  avatarContainer: {
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ModernHeader;