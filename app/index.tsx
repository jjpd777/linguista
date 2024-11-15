import { useCallback, useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

export default function ReadingTestScreen() {
  const [inputText, setInputText] = useState('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [wpm, setWpm] = useState('300'); // Default 300 WPM
  const [currentChunk, setCurrentChunk] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const wordChunksRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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
          <TouchableOpacity 
            style={[
              styles.button,
              (!inputText.trim() || !wpm.trim()) && styles.buttonDisabled
            ]} 
            onPress={startReading}
            disabled={!inputText.trim() || !wpm.trim()}
          >
            <ThemedText style={styles.buttonText}>Begin Reading</ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ThemedView style={styles.readingContainer}>
            <ThemedView style={styles.focusLine} />
            <ThemedText style={styles.readingText}>
              {currentChunk}
            </ThemedText>
            <ThemedView style={styles.focusLine} />
            <ThemedText style={styles.wpmDisplay}>
              {wpm} WPM
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.controlsContainer}>
            {isPlaying ? (
              <TouchableOpacity style={styles.controlButton} onPress={stopReading}>
                <ThemedText style={styles.controlButtonText}>❚❚</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.controlButton} onPress={startReading}>
                <ThemedText style={styles.controlButtonText}>▶</ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.controlButton, styles.resetButton]} 
              onPress={resetTest}
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
    alignItems: 'center',
    marginHorizontal: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  focusLine: {
    width: width * 0.8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 40,
  },
  readingText: {
    fontSize: 38,
    textAlign: 'center',
    lineHeight: 46,
    fontWeight: '500',
    paddingHorizontal: 20,
    maxWidth: width * 0.9,
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
});