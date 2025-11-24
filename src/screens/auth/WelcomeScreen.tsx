import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { theme } from '../../theme/theme';
import Button from '../../components/ui/Button';
import { navigate } from '../../navigation/navigationService';
import Logo from '../../components/common/Logo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHONE_WIDTH = Math.min(280, SCREEN_WIDTH * 0.75);
const PHONE_HEIGHT = PHONE_WIDTH * 2; // Maintain 2:1 aspect ratio

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  video: any; // Video source
  icon?: string;
}

// 3D Smartphone Render Component
const PhoneFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.phone3DContainer}>
      {/* Top Edge - Creates 3D depth */}
      <View style={styles.phoneTopEdge} />
      
      {/* Main Phone Bezel with 3D effect */}
      <View style={styles.phoneBezel}>
        {/* Left Edge Shadow */}
        <View style={styles.phoneLeftEdge} />
        
        {/* Screen Area - fills the bezel */}
        <View style={styles.phoneScreen}>
          {children}
        </View>
        
        {/* Right Edge Shadow */}
        <View style={styles.phoneRightEdge} />
        
        {/* Notch/Status Bar Area - positioned absolutely at top */}
        <View style={styles.phoneNotch} />
        
        {/* Home Indicator - positioned absolutely at bottom */}
        <View style={styles.homeIndicator} />
      </View>
      
      {/* Bottom Edge - Creates 3D depth */}
      <View style={styles.phoneBottomEdge} />
    </View>
  );
};

// Video Photo Component - Individual photo thrown on table
const VideoPhoto = ({ video, index, isActive, rotation, position }: { 
  video: any; 
  index: number; 
  isActive: boolean;
  rotation: number;
  position: { x: number; y: number };
}) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.playAsync();
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
      videoRef.current.setPositionAsync(0);
    }
  }, [isActive]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.positionMillis && status.positionMillis >= 2000) {
        videoRef.current?.setPositionAsync(0);
        videoRef.current?.playAsync();
      }
      if (status.didJustFinish) {
        videoRef.current?.setPositionAsync(0);
        videoRef.current?.playAsync();
      }
    }
  };

  return (
    <View style={[
      styles.thrownPhoto,
      {
        transform: [
          { rotate: `${rotation}deg` },
          { translateX: position.x },
          { translateY: position.y },
        ],
        zIndex: index,
      }
    ]}>
      <PhoneFrame>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={video}
            style={styles.carouselVideo}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay={isActive}
            isMuted={true}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </View>
      </PhoneFrame>
    </View>
  );
};

// Carousel item showing photo thrown on table
const CarouselItem = ({ item, index, isActive }: { 
  item: CarouselSlide; 
  index: number; 
  isActive: boolean;
}) => {
  // Generate rotation and position for this specific item
  const rotations = [-12, 8, -15, 10];
  const positions = [
    { x: -30, y: -15 },
    { x: 25, y: 10 },
    { x: -40, y: -20 },
    { x: 30, y: 15 },
  ];
  
  const rotation = rotations[index % rotations.length];
  const position = positions[index % positions.length];

  return (
    <View style={styles.carouselItem}>
      {/* Table background */}
      <View style={styles.tableBackground} />
      
      {/* Photo thrown on table */}
      <View style={styles.photosContainer}>
        <VideoPhoto
          video={item.video}
          index={index}
          isActive={isActive}
          rotation={rotation}
          position={position}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    </View>
  );
};

const WelcomeScreen = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Service features carousel data with videos
  const carouselData: CarouselSlide[] = [
    {
      id: '1',
      title: t('welcome.discoverServices') || 'Discover Services',
      description: t('welcome.discoverServicesDesc') || 'Find the best beauty, wellness, and style professionals in your area',
      video: require('../../../assets/barber.mp4'),
    },
    {
      id: '2',
      title: t('welcome.easyBooking') || 'Easy Booking',
      description: t('welcome.easyBookingDesc') || 'Book appointments quickly and easily with just a few taps',
      video: require('../../../assets/hair.mp4'),
    },
    {
      id: '3',
      title: t('welcome.manageBusiness') || 'Manage Your Business',
      description: t('welcome.manageBusinessDesc') || 'Business owners can manage bookings, employees, and services all in one place',
      video: require('../../../assets/massage.mp4'),
    },
    {
      id: '4',
      title: t('welcome.rewards') || 'Earn Rewards',
      description: t('welcome.rewardsDesc') || 'Get rewarded for your loyalty with points and special offers',
      video: require('../../../assets/nails.mp4'),
    },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };


  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    );
  };

  const handleLogin = () => {
    navigate('Login');
  };

  const handleRegister = () => {
    navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Splash-style Header with Blue Background */}
        <View style={styles.splashHeader}>
          <View style={styles.logoContainer}>
            <Logo width={120} height={120} style={styles.logoImage} />
          </View>
          <Text style={styles.appName}>LinkUup</Text>
          <Text style={styles.tagline}>
            {t('welcome.tagline') || 'Book Smarter. Grow Faster.'}
          </Text>
        </View>

        {/* Carousel - Blue background section */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselData}
              renderItem={({ item, index }) => (
                <CarouselItem 
                  item={item} 
                  index={index} 
                  isActive={index === currentIndex}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="center"
            />
            {renderPagination()}
          </View>

          {/* Action Buttons - Always visible at bottom */}
          <View style={styles.buttonContainer}>
          <Button
            title={t('welcome.getStarted') || 'Get Started'}
            onPress={handleRegister}
            variant="primary"
            size="lg"
            style={styles.primaryButton}
          />
          <Button
            title={t('welcome.login') || 'Login'}
            onPress={handleLogin}
            variant="primary"
            size="lg"
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6', // Vibrant blue background matching splash
  },
  content: {
    flex: 1,
  },
  splashHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: '#3b82f6', // Vibrant blue background
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    ...theme.shadows.lg,
  } as const,
  appName: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.extrabold as any,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: theme.typography.fontSize.lg,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium as any,
  },
  carouselSection: {
    flex: 1,
    backgroundColor: '#3b82f6', // Match the blue background
    paddingTop: theme.spacing.xl,
    justifyContent: 'space-between',
    overflow: 'visible',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    minHeight: 0, // Allow flex shrinking
    overflow: 'visible',
  },
  carouselItem: {
    width: SCREEN_WIDTH - theme.spacing.lg * 2,
    minHeight: SCREEN_HEIGHT * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  tableBackground: {
    position: 'absolute',
    top: 0,
    left: -theme.spacing.lg,
    right: -theme.spacing.lg,
    bottom: 0,
    backgroundColor: '#8B7355', // Wooden table color
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#6B5B3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  photosContainer: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  thrownPhoto: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
  },
  phone3DContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    transform: [{ perspective: 1000 }],
  },
  phoneTopEdge: {
    width: PHONE_WIDTH + 8,
    height: 4,
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginBottom: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  phoneBottomEdge: {
    width: PHONE_WIDTH + 8,
    height: 4,
    backgroundColor: '#0a0a0a',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginTop: -2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneBezel: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#000000',
    borderRadius: 40,
    padding: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    // Enhanced 3D shadow effects
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 20,
    // Metallic frame effect
    borderWidth: 3,
    borderColor: '#1a1a1a',
    // Inner shadow for depth
    borderTopColor: '#2a2a2a',
    borderBottomColor: '#0a0a0a',
  },
  phoneLeftEdge: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 40,
    borderBottomLeftRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    zIndex: 5,
  },
  phoneRightEdge: {
    position: 'absolute',
    right: 0,
    top: 12,
    bottom: 12,
    width: 3,
    backgroundColor: '#2a2a2a',
    borderTopRightRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    zIndex: 5,
  },
  phoneScreen: {
    width: PHONE_WIDTH - 24, // Account for padding (12 * 2)
    height: PHONE_HEIGHT - 24, // Account for padding (12 * 2)
    backgroundColor: '#000000',
    borderRadius: 32,
    overflow: 'hidden',
    // Screen glass effect
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  phoneNotch: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -(PHONE_WIDTH * 0.4) / 2,
    width: PHONE_WIDTH * 0.4,
    height: 28,
    backgroundColor: '#000000',
    borderRadius: 14,
    zIndex: 15,
    // Notch shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -(PHONE_WIDTH * 0.35) / 2,
    width: PHONE_WIDTH * 0.35,
    height: 5,
    backgroundColor: '#ffffff',
    borderRadius: 3,
    opacity: 0.4,
    zIndex: 15,
    // Home indicator shadow
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  carouselVideo: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  carouselTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: '#FFFFFF', // White text for blue background
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  carouselDescription: {
    fontSize: theme.typography.fontSize.base,
    color: '#E0E7FF', // Light blue/white for better contrast
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderLight,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#3b82f6',
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  primaryButton: {
    width: '100%',
    ...theme.shadows.md,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
});

export default WelcomeScreen;

