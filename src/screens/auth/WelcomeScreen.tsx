import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { theme } from '../../theme/theme';
import Button from '../../components/ui/Button';
import { navigate } from '../../navigation/navigationService';
import Logo from '../../components/common/Logo';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_WIDTH = SCREEN_WIDTH * 0.85;
const ITEM_SPACING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

interface CarouselSlide {
  id: string;
  title: string;
  description: string;
  video: any; // Video source
}

// Modern Card Carousel Item
const CarouselItem = ({ item, isActive }: { 
  item: CarouselSlide; 
  isActive: boolean;
}) => {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      // Reset and play when active
      videoRef.current.setPositionAsync(0);
      videoRef.current.playAsync();
    } else if (videoRef.current) {
      // Pause when not active
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  return (
    <View style={styles.carouselItemContainer}>
      <View style={styles.videoCard}>
        <Video
          ref={videoRef}
          source={item.video}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          isLooping={true} 
          shouldPlay={isActive}
          isMuted={true}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
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
      id: '0',
      title: t('welcome.welcome') || 'Welcome to LinkUup',
      description: t('welcome.welcomeDesc') || 'The professional platform for all your service needs.',
      video: require('../../../assets/welcome.mp4'),
    },
    {
      id: '1',
      title: t('welcome.fitness') || 'Fitness & Training',
      description: t('welcome.fitnessDesc') || 'Find personal trainers and fitness classes near you.',
      video: require('../../../assets/pt.mp4'),
    },
    {
      id: '2',
      title: t('welcome.petCare') || 'Pet Care Services',
      description: t('welcome.petCareDesc') || 'Trusted professionals for your furry friends.',
      video: require('../../../assets/dog.mp4'),
    },
    {
      id: '3',
      title: t('welcome.discoverServices') || 'Discover Services',
      description: t('welcome.discoverServicesDesc') || 'Find the best beauty, wellness, and style professionals in your area',
      video: require('../../../assets/barber.mp4'),
    },
    {
      id: '4',
      title: t('welcome.easyBooking') || 'Easy Booking',
      description: t('welcome.easyBookingDesc') || 'Book appointments quickly and easily with just a few taps',
      video: require('../../../assets/hair.mp4'),
    },
    {
      id: '5',
      title: t('welcome.manageBusiness') || 'Manage Your Business',
      description: t('welcome.manageBusinessDesc') || 'Business owners can manage bookings, employees, and services all in one place',
      video: require('../../../assets/massage.mp4'),
    },
    {
      id: '6',
      title: t('welcome.rewards') || 'Earn Rewards',
      description: t('welcome.rewardsDesc') || 'Get rewarded for your loyalty with points and special offers',
      video: require('../../../assets/nails.mp4'),
    },
  ];

  // Auto-advance timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselData.length === 0) return;

      let nextIndex = currentIndex + 1;
      if (nextIndex >= carouselData.length) {
        nextIndex = 0;
      }

      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 2000); // Switch every 2 seconds

    return () => clearInterval(interval);
  }, [currentIndex, carouselData.length]);

  const handleLogin = () => {
    navigate('Login');
  };

  const handleRegister = () => {
    navigate('Register');
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header Background with Curve */}
      <View style={styles.headerBackground}>
        <View style={styles.headerCurve} />
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
             <Logo width={40} height={40} style={styles.headerLogo} color="#FFFFFF" />
             <Text style={styles.headerAppName}>LinkUup</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.carouselContainer}>
            <FlatList
              ref={flatListRef}
              data={carouselData}
              renderItem={({ item, index }) => (
                <CarouselItem 
                  item={item} 
                  isActive={index === currentIndex}
                />
              )}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEnabled={true} // Enable manual scrolling
              onScroll={(event) => {
                const scrollPosition = event.nativeEvent.contentOffset.x;
                const index = Math.round(scrollPosition / SCREEN_WIDTH);
                if (index !== currentIndex) {
                  setCurrentIndex(index);
                }
              }}
              scrollEventThrottle={16}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />
          </View>
          
          {renderPagination()}

          <View style={styles.bottomSection}>
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
                  textStyle={styles.secondaryButtonText}
                />
              </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35, // Cover top portion
    backgroundColor: theme.colors.primary,
    zIndex: 0,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -50,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: SCREEN_WIDTH / 2,
    borderBottomRightRadius: SCREEN_WIDTH / 2,
    transform: [{ scaleX: 1.5 }],
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  headerAppName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold as any,
    color: '#FFFFFF', // White text for blue background
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xl,
    zIndex: 1,
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: SCREEN_HEIGHT * 0.6,
    marginTop: theme.spacing.lg,
  },
  carouselItemContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  videoCard: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
    backgroundColor: '#000', // Fallback
    marginBottom: theme.spacing.lg,
    borderWidth: 4,
    borderColor: '#FFFFFF', // White border for card
  },
  video: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold as any,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textLight,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderDark,
    opacity: 0.2,
  },
  paginationDotActive: {
    backgroundColor: theme.colors.primary,
    opacity: 1,
    width: 20,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  buttonContainer: {
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  primaryButton: {
    width: '100%',
    ...theme.shadows.md,
  },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
});

export default WelcomeScreen;
