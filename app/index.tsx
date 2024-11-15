import { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform, Animated, View } from 'react-native';
import { BlurView } from 'expo-blur';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

type ReadingMode = 'chunk' | 'scroll';

export default function ReadingTestScreen() {
  const [inputText, setInputText] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [wpm, setWpm] = useState('300'); // Default 300 WPM
  const [currentChunk, setCurrentChunk] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const wordChunksRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const [readingMode, setReadingMode] = useState<ReadingMode>('chunk');
  const scrollY = useRef(new Animated.Value(0)).current;
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const [showIntro, setShowIntro] = useState(false);

  const prepareWordChunks = useCallback((text: string) => {
    const words = text.trim().split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += 4) {
      const chunk = words.slice(i, i + 4).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }, []);

  const startReading = useCallback(() => {
    if (!inputText.trim() || !wpm.trim()) return;

    const chunks = prepareWordChunks(inputText);
    wordChunksRef.current = chunks;
    currentIndexRef.current = 0;
    
    // Calculate milliseconds per chunk (4 words)
    const msPerWord = (60 * 1000) / parseInt(wpm);
    const msPerChunk = msPerWord * 4;

    setIsTestMode(true);
    setIsPlaying(true);
    
    // Display first chunk immediately
    setCurrentChunk(chunks[0]);

    // Start interval for subsequent chunks
    intervalRef.current = setInterval(() => {
      currentIndexRef.current++;
      
      if (currentIndexRef.current >= chunks.length) {
        stopReading();
        return;
      }
      
      setCurrentChunk(chunks[currentIndexRef.current]);
    }, msPerChunk);
  }, [inputText, wpm, prepareWordChunks]);

  const stopReading = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
  }, []);

  const resetTest = useCallback(() => {
    stopReading();
    setIsTestMode(false);
    setCurrentChunk('');
    currentIndexRef.current = 0;
  }, [stopReading]);

  const startScrolling = useCallback(() => {
    if (!inputText.trim() || !wpm.trim()) return;
    
    setIsTestMode(true);
    setIsPlaying(true);
    setShowIntro(true);

    // Remove the setTimeout and start scrolling immediately
    const wordsPerMinute = parseInt(wpm);
    const words = inputText.trim().split(/\s+/);
    const totalDistance = height * 2;
    const pixelsPerMs = totalDistance / ((words.length / wordsPerMinute) * 60 * 1000);
    
    startTimeRef.current = Date.now();
    scrollY.setValue(0);

    const animate = () => {
      const elapsedMs = Date.now() - startTimeRef.current;
      const newPosition = elapsedMs * pixelsPerMs;
      
      if (newPosition >= totalDistance) {
        stopScrolling();
        return;
      }
      
      scrollY.setValue(newPosition / totalDistance);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Set a timer to hide the intro text after 2 seconds
    setTimeout(() => {
      setShowIntro(false);
    }, 2000);
  }, [inputText, wpm, scrollY]);

  const stopScrolling = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
  }, []);

  const resetScrolling = useCallback(() => {
    stopScrolling();
    setIsTestMode(false);
    scrollY.setValue(0);
  }, [stopScrolling, scrollY]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const renderReadingMode = () => {
    if (!isTestMode) return null;

    if (readingMode === 'chunk') {
      return (
        <ThemedView style={styles.readingContainer}>
          <View style={styles.textWrapper}>
            <View style={styles.textContainer}>
              <ThemedText style={styles.readingText}>
                {currentChunk.split('\n')[0]}
              </ThemedText>
              <ThemedText style={styles.readingText}>
                {currentChunk.split('\n')[1]}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      );
    }

    return (
      <View style={styles.scrollContainer}>
        {showIntro && (
          <View style={styles.introOverlay}>
            <BlurView intensity={20} style={styles.blurContainer}>
              <ThemedText style={styles.introText}>
                Speak this paragraph
              </ThemedText>
            </BlurView>
          </View>
        )}
        <Animated.View
          style={[
            styles.scrollingTextContainer,
            {
              transform: [{
                translateY: scrollY.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.7, -height * 1.8]
                })
              }]
            }
          ]}
        >
          <ThemedText style={styles.scrollingText} numberOfLines={0}>
            {inputText}
          </ThemedText>
        </Animated.View>
        <View style={styles.focusOverlay}>
          <View style={styles.focusLine} />
          <View style={styles.focusLine} />
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {!isTestMode ? (
        <>
          <ThemedText type="title" style={styles.title}>
            Speed Reading
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Train your brain to read faster
          </ThemedText>
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
          <ThemedView style={styles.modeContainer}>
            <TouchableOpacity 
              style={[styles.modeButton, readingMode === 'chunk' && styles.modeButtonActive]}
              onPress={() => setReadingMode('chunk')}
            >
              <ThemedText style={styles.modeButtonText}>Chunk Mode</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, readingMode === 'scroll' && styles.modeButtonActive]}
              onPress={() => setReadingMode('scroll')}
            >
              <ThemedText style={styles.modeButtonText}>Scroll Mode</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          <TouchableOpacity 
            style={styles.button}
            onPress={readingMode === 'chunk' ? startReading : startScrolling}
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
                onPress={readingMode === 'chunk' ? stopReading : stopScrolling}
              >
                <ThemedText style={styles.controlButtonText}>❚❚</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={readingMode === 'chunk' ? startReading : startScrolling}
              >
                <ThemedText style={styles.controlButtonText}>▶</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.controlButton, styles.resetButton]} 
              onPress={readingMode === 'chunk' ? resetTest : resetScrolling}
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  modeButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#0a7ea4',
  },
  modeButtonText: {
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
  scrollingTextContainer: {
    position: 'absolute',
    width: '100%',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 100 : 20,
  },
  scrollingText: {
    fontSize: Platform.OS === 'android' ? 32 : 38,
    textAlign: 'center',
    lineHeight: 46,
    fontWeight: '500',
    maxWidth: width * 0.9,
    flexWrap: 'wrap',
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
    top: '20%',
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
});