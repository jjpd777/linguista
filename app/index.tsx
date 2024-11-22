import { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform, Animated, View, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { Audio, Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

export default function ReadingTestScreen() {
  const [inputText, setInputText] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [wpm, setWpm] = useState('300'); // Default 300 WPM
  const [isPlaying, setIsPlaying] = useState(false);
  const scrollY = useRef(0);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const [showIntro, setShowIntro] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollInterval = useRef<NodeJS.Timer>();
  const contentHeight = useRef(0);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const videoRef = useRef<Video>(null);

  const onContentLayout = useCallback((event) => {
    contentHeight.current = event.nativeEvent.layout.height;
  }, []);

  const stopScrolling = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    setIsPlaying(false);
  }, []);

  const startScrolling = useCallback(() => {
    if (!inputText.trim() || !wpm.trim()) return;
    
    setIsTestMode(true);
    setIsPlaying(true);
    setShowIntro(true);

    const wordsPerMinute = parseInt(wpm);
    const wordCount = inputText.trim().split(/\s+/).length;
    const totalScrollDistance = contentHeight.current;
    const readingTimeInMinutes = wordCount / wordsPerMinute;
    const readingTimeInMs = readingTimeInMinutes * 60 * 1000;
    
    // Adjust update frequency for Android
    const updateIntervalMs = Platform.OS === 'android' ? 32 : 16; // 30fps for Android, 60fps for iOS/web
    
    // Calculate scroll per interval
    const totalIntervals = readingTimeInMs / updateIntervalMs;
    const pixelsPerInterval = totalScrollDistance / totalIntervals;

    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }

    // Reset scroll position
    scrollY.current = 0;
    scrollViewRef.current?.scrollTo({
      y: 0,
      animated: false
    });

    let lastTime = Date.now();
    scrollInterval.current = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Adjust for any frame drops
      const adjustment = deltaTime / updateIntervalMs;
      scrollY.current += pixelsPerInterval * adjustment;

      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: scrollY.current,
          animated: false
        });
      });

      if (scrollY.current >= totalScrollDistance) {
        stopScrolling();
      }
    }, updateIntervalMs);

    setTimeout(() => {
      setShowIntro(false);
    }, 3000);
  }, [inputText, wpm, stopScrolling]);

  const resetScrolling = useCallback(() => {
    stopScrolling();
    setIsTestMode(false);
    scrollY.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [stopScrolling]);

  // Make sure to clean up the interval
  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  const renderReadingMode = () => {
    if (!isTestMode) return null;

    return (
      <View style={styles.scrollContainer}>
        {showIntro && (
          <View style={styles.introOverlay}>
            <BlurView intensity={20} style={styles.blurContainer}>
              <ThemedText style={styles.introText}>
                Speak fast & clear
              </ThemedText>
            </BlurView>
          </View>
        )}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={true}
          overScrollMode="never"  // Android specific
          bounces={false}        // iOS specific
        >
          <View 
            style={styles.scrollingTextContainer}
            onLayout={onContentLayout}
          >
            <ThemedText 
              style={styles.scrollingText}
              allowFontScaling={false}  // Prevent font scaling issues
            >
              {inputText}
            </ThemedText>
          </View>
        </ScrollView>
        <View style={styles.focusOverlay}>
          <View style={styles.focusLine} />
          <View style={styles.focusLine} />
        </View>
      </View>
    );
  };

  const renderCamera = () => {
    if (!permission || !audioPermission) {
      return <View />;
    }

    if (!permission.granted || !audioPermission.granted) {
      return (
        <View style={styles.container}>
          <ThemedText style={styles.message}>We need camera and audio permissions</ThemedText>
          <TouchableOpacity 
            style={styles.button} 
            onPress={async () => {
              await requestPermission();
              await requestAudioPermission();
            }}
          >
            <ThemedText style={styles.buttonText}>Grant permissions</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    const toggleCameraFacing = () => {
      setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    const startRecording = async () => {
      if (cameraRef.current) {
        try {
          setIsRecording(true);
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60,
            maxFileSize: 100 * 1024 * 1024,
            quality: '1080p',
            mute: false,
            videoBitrate: 5000000,
            fps: 30,
          });
          
          if (video) {
            setRecordedVideo(video.uri);
          }
        } catch (error) {
          console.error('Recording failed:', error);
        } finally {
          setIsRecording(false);
        }
      }
    };

    const stopRecording = async () => {
      if (cameraRef.current && isRecording) {
        try {
          await cameraRef.current.stopRecording();
        } catch (error) {
          console.error('Stop recording failed:', error);
        }
      }
    };

    if (recordedVideo) {
      return (
        <View style={styles.container}>
          <Video
            ref={videoRef}
            source={{ uri: recordedVideo }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={status => setStatus(status)}
          />
          <View style={styles.previewButtons}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => {
                if (status?.isPlaying) {
                  videoRef.current?.pauseAsync();
                } else {
                  videoRef.current?.playAsync();
                }
              }}
            >
              <ThemedText style={styles.buttonText}>
                {status?.isPlaying ? 'Pause' : 'Play'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setRecordedVideo(null)}
            >
              <ThemedText style={styles.buttonText}>Record Again</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.exitButton]} 
              onPress={() => {
                setRecordedVideo(null);
                setShowCamera(false);
              }}
            >
              <ThemedText style={styles.buttonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
          video={true}
          mode="video"
        >
          <TouchableOpacity 
            style={styles.exitButton} 
            onPress={() => setShowCamera(false)}
          >
            <ThemedText style={styles.exitButtonText}>×</ThemedText>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <ThemedText style={styles.flipButtonText}>Flip</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <ThemedText style={styles.flipButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {showCamera ? (
        renderCamera()
      ) : !isTestMode ? (
        <>
          <ThemedText type="title" style={styles.title}>
            Speed Reading
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Train your brain to read faster
          </ThemedText>
          
          <TouchableOpacity 
            style={[styles.button, styles.cameraButton]}
            onPress={() => setShowCamera(true)}
          >
            <ThemedText style={styles.buttonText}>Open Camera</ThemedText>
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { color: '#fff' }]}
            multiline
            placeholder="Paste your text here..."
            value={inputText}
            onChangeText={setInputText}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
          />
          <ThemedView style={styles.wpmContainer}>
            <ThemedText style={styles.wpmLabel}>Reading Speed (WPM):</ThemedText>
            <TextInput
              style={[styles.wpmInput, { color: '#fff' }]}
              keyboardType="numeric"
              value={wpm}
              onChangeText={setWpm}
              maxLength={4}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </ThemedView>
          <TouchableOpacity 
            style={styles.button}
            onPress={startScrolling}
          >
            <ThemedText style={styles.buttonText}>Begin Reading</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {renderReadingMode()}
          <ThemedView style={styles.controlsContainer}>
            {isPlaying ? (
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={stopScrolling}
              >
                <ThemedText style={styles.controlButtonText}>❚❚</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={startScrolling}
              >
                <ThemedText style={styles.controlButtonText}>▶</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.controlButton, styles.resetButton]} 
              onPress={resetScrolling}
            >
              <ThemedText style={styles.controlButtonText}>×</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 36,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  wpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'center',
    gap: 15,
  },
  wpmLabel: {
    fontSize: 16,
    opacity: 0.8,
  },
  wpmInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    width: 100,
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  button: {
    backgroundColor: '#0a7ea4',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  readingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textWrapper: {
    height: 200,  // Fixed height
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readingText: {
    fontSize: Platform.OS === 'android' ? 32 : 38,
    textAlign: 'center',
    includeFontPadding: false,
    padding: 0,
    margin: 0,
  },
  wpmDisplay: {
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: 16,
    opacity: 0.5,
  },
  controlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 10,
    right: 10,
    bottom: Platform.OS === 'ios' ? 40 : 20,
    zIndex: 10,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 126, 164, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.6)',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  scrollingTextContainer: {
    padding: 20,
    paddingTop: height / 2,
    paddingBottom: height / 2,
    backgroundColor: 'transparent',
  },
  scrollingText: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 48,
    fontWeight: '500',
    maxWidth: width * 0.9,
    includeFontPadding: false,    // Android specific
    textAlignVertical: 'center',  // Android specific
  },
  focusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introOverlay: {
    position: 'absolute',
    top: height * 0.2,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    padding: 20,
  },
  blurContainer: {
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  introText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(10, 126, 164, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    paddingVertical: 10,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 20,
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    marginBottom: 20,
    backgroundColor: '#2c5282', // Different color to distinguish it
  },
  recordButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  exitButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  exitButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  previewButtons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
});