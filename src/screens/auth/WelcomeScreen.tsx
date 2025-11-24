import React, { useRef, useState, useEffect } from 'react';
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
const PHONE_WIDTH = Math.min(280, SCREEN_WIDTH * 0.7);
const PHONE_HEIGHT = PHONE_WIDTH * 2; // Maintain 2:1 aspect ratio

// Debug: Log dimensions to verify they're calculated
if (__DEV__) {
  console.log('Phone Frame Dimensions:', { PHONE_WIDTH, PHONE_HEIGHT, SCREEN_WIDTH });
}

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  video: any; // Video source
  icon?: string;
}

// Phone Frame Component
const PhoneFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={styles.phoneFrame}>
      {/* Phone Bezel/Frame */}
      <View style={styles.phoneBezel}>
        {/* Screen Area - fills the bezel */}
        <View style={styles.phoneScreen}>
          {children}
        </View>
        
        {/* Notch/Status Bar Area - positioned absolutely at top */}
        <View style={styles.phoneNotch} />
        
        {/* Home Indicator - positioned absolutely at bottom */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

// Separate component for carousel item with video
const CarouselItem = ({ item, index, isActive }: { item: CarouselSlide; index: number; isActive: boolean }) => {
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
      // Limit video playback to 2 seconds max, then loop
      if (status.positionMillis && status.positionMillis >= 2000) {
        videoRef.current?.setPositionAsync(0);
        videoRef.current?.playAsync();
      }
      // Loop when video finishes
      if (status.didJustFinish) {
        videoRef.current?.setPositionAsync(0);
        videoRef.current?.playAsync();
      }
    }
  };

  return (
    <View style={styles.carouselItem}>
      <PhoneFrame>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={item.video}
            style={styles.carouselVideo}
            resizeMode={ResizeMode.COVER}
            isLooping={false}
            shouldPlay={isActive}
            isMuted={true}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </View>
      </PhoneFrame>
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

        {/* Carousel - White background section */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselData}
              renderItem={({ item, index }) => (
                <CarouselItem item={item} index={index} isActive={index === currentIndex} />
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
            variant="outline"
            size="lg"
            style={styles.secondaryButton}
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
    backgroundColor: theme.colors.backgroundLight,
    borderTopLeftRadius: theme.borderRadius.xl * 2,
    borderTopRightRadius: theme.borderRadius.xl * 2,
    paddingTop: theme.spacing.xl,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  carouselItem: {
    width: SCREEN_WIDTH - theme.spacing.lg * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  phoneFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  phoneBezel: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    minWidth: 200, // Ensure minimum visibility
    minHeight: 400, // Ensure minimum visibility
    backgroundColor: '#1a1a1a',
    borderRadius: 40,
    padding: 8,
    ...theme.shadows.lg,
    borderWidth: 4,
    borderColor: '#2a2a2a',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // Ensure notch and indicator are visible
  },
  phoneScreen: {
    width: Math.max(PHONE_WIDTH - 16, 184), // Account for padding (8 * 2), ensure minimum
    height: Math.max(PHONE_HEIGHT - 16, 384), // Account for padding (8 * 2), ensure minimum
    backgroundColor: '#000000',
    borderRadius: 32,
    overflow: 'hidden',
  },
  phoneNotch: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -(PHONE_WIDTH * 0.43) / 2,
    width: PHONE_WIDTH * 0.43,
    height: 25,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    zIndex: 10,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 12,
    left: '50%',
    marginLeft: -(PHONE_WIDTH * 0.43) / 2,
    width: PHONE_WIDTH * 0.43,
    height: 4,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    opacity: 0.3,
    zIndex: 10,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 32, // Match phoneScreen borderRadius to ensure proper clipping
    overflow: 'hidden',
  },
  carouselVideo: {
    width: '100%',
    height: '100%',
    // borderRadius not supported on Video component, rely on container clipping
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  carouselTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  carouselDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.placeholderLight,
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
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    width: '100%',
    ...theme.shadows.md,
  },
  secondaryButton: {
    width: '100%',
  },
});

export default WelcomeScreen;

