import { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform, Animated, View, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
import { Audio, Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

// New component for the camera functionality
function ReadingCamera({ 
  permission, 
  audioPermission, 
  requestPermission, 
  requestAudioPermission 
}) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const videoRef = useRef<Video>(null);

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
        <View style={styles.previewButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.retakeButton]}
            onPress={() => setRecordedVideo(null)}
          >
            <ThemedText style={styles.buttonText}>Record Again</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={async () => {
              try {
                const asset = await MediaLibrary.createAssetAsync(recordedVideo);
                await MediaLibrary.createAlbumAsync('Reading Tests', asset, false);
                Alert.alert('Success', 'Video saved to gallery!');
              } catch (error) {
                Alert.alert('Error', 'Failed to save video');
                console.error('Save error:', error);
              }
            }}
          >
            <ThemedText style={styles.buttonText}>Save Video</ThemedText>
          </TouchableOpacity>
        </View>
        <Video
          ref={videoRef}
          source={{ uri: recordedVideo }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          isLooping
          onPlaybackStatusUpdate={status => setStatus(status)}
        />
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
        video={true}
        mode="video"
      >
        <TouchableOpacity 
          style={styles.flipButton}
          onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
        >
          <ThemedText style={styles.flipButtonText}>Flip</ThemedText>
        </TouchableOpacity>
      </CameraView>
      <View style={styles.recordButtonContainer}>
        {!isRecording ? (
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={startRecording}
          >
            <ThemedText style={styles.recordButtonText}>
              Start Recording
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.recordButton, styles.recordingButton]}
            onPress={stopRecording}
          >
            <ThemedText style={styles.recordButtonText}>
              Stop Recording
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// New component for the scrolling text functionality
function ScrollingText({ 
  inputText, 
  wpm, 
  isPlaying, 
  showIntro,
  onContentLayout,
  onScrollComplete,
  onPlay,
  onPause,
  onReset 
}: {
  inputText: string;
  wpm: string;
  isPlaying: boolean;
  showIntro: boolean;
  onContentLayout: (event: any) => void;
  onScrollComplete: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}) {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const scrollInterval = useRef<NodeJS.Timer>();
  const contentHeight = useRef(0);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current);
      }
    };
  }, []);

  // Handle scrolling when isPlaying changes
  useEffect(() => {
    if (isPlaying) {
      startScrolling();
    } else {
      stopScrolling();
    }
  }, [isPlaying]);

  const stopScrolling = useCallback(() => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = undefined;
    }
    onScrollComplete();
  }, [onScrollComplete]);

  const startScrolling = useCallback(() => {
    if (!inputText.trim() || !wpm.trim()) return;

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
  }, [inputText, wpm, stopScrolling]);

  // Update contentHeight when layout changes
  const handleContentLayout = (event: any) => {
    contentHeight.current = event.nativeEvent.layout.height;
    onContentLayout(event);
  };

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
        overScrollMode="never"
        bounces={false}
      >
        <View 
          style={styles.scrollingTextContainer}
          onLayout={handleContentLayout}
        >
          <ThemedText 
            style={styles.scrollingText}
            allowFontScaling={false}
          >
            {inputText}
          </ThemedText>
        </View>
      </ScrollView>

      <View style={styles.scrollControlsContainer}>
        {isPlaying ? (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onPause}
          >
            <ThemedText style={styles.controlButtonText}>⏸</ThemedText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onPlay}
          >
            <ThemedText style={styles.controlButtonText}>▶️</ThemedText>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.controlButton, styles.resetButton]}
          onPress={onReset}
        >
          <ThemedText style={styles.controlButtonText}>↺</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReadingTestScreen() {
  const [inputText, setInputText] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [wpm, setWpm] = useState('300');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const contentHeight = useRef(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, requestAudioPermission] = Audio.usePermissions();

  const startScrolling = useCallback(() => {
    if (!isTestMode) {
      setIsTestMode(true);
      setShowIntro(true);
      setShowCamera(true);
    }
    setIsPlaying(true);
  }, [isTestMode]);

  const stopScrolling = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetScrolling = useCallback(() => {
    stopScrolling();
    setIsTestMode(false);
  }, [stopScrolling]);

  return (
    <ThemedView style={styles.container}>
      {!isTestMode ? (
        <>
          <ThemedText style={styles.title}>Reading Test</ThemedText>
          <ThemedText style={styles.subtitle}>
            Enter your text and set your reading speed
          </ThemedText>
          
          <TextInput
            style={styles.input}
            multiline
            placeholder="Enter your text here..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={inputText}
            onChangeText={setInputText}
          />
          
          <View style={styles.wpmContainer}>
            <ThemedText style={styles.wpmLabel}>Words per minute:</ThemedText>
            <TextInput
              style={styles.wpmInput}
              keyboardType="numeric"
              value={wpm}
              onChangeText={setWpm}
              maxLength={4}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!inputText.trim() || !wpm.trim()) && styles.buttonDisabled
            ]}
            onPress={startScrolling}
            disabled={!inputText.trim() || !wpm.trim()}
          >
            <ThemedText style={styles.buttonText}>Start Test</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.readingSection}>
            <ScrollingText
              inputText={inputText}
              wpm={wpm}
              isPlaying={isPlaying}
              showIntro={showIntro}
              onContentLayout={(event) => {
                contentHeight.current = event.nativeEvent.layout.height;
              }}
              onScrollComplete={stopScrolling}
              onPlay={startScrolling}
              onPause={stopScrolling}
              onReset={resetScrolling}
            />
          </View>

          <View style={styles.cameraSection}>
            <ReadingCamera
              permission={permission}
              audioPermission={audioPermission}
              requestPermission={requestPermission}
              requestAudioPermission={requestAudioPermission}
            />
          </View>
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
    minWidth: 140,
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
  videoControlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 10,
    right: 10,
    top: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 10,
  },
  scrollControlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 10,
    right: 10,
    bottom: 40,
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
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    aspectRatio: 16 / 9, // This maintains a consistent video aspect ratio
    alignSelf: 'center',
  },
  recordButtonContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: '10%', // Adjust this value to position the button where you want it
  },
  recordButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    padding: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 25,
    zIndex: 10,
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
  video: {
    flex: 1,
    width: '100%',
    aspectRatio: 16 / 9,
    alignSelf: 'center',
  },
  previewButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  readingSection: {
    flex: 1,
    width: '100%',
  },
  
  cameraSection: {
    flex: 1,
    width: '100%',
  },

  controlBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  controlGroup: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },

  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  resetButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },

  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  scrollControlsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    gap: 10,
    bottom: 20,
    alignSelf: 'center',
    zIndex: 10,
  },

  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 126, 164, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  resetButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
  },

  controlButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  retakeButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)', // Red tint
    flex: 1,
    maxWidth: 150,
  },

  saveButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.8)', // Green tint
    flex: 1,
    maxWidth: 150,
  },

  button: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})