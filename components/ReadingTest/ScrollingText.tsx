import { useCallback, useState, useRef, useEffect } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { ThemedText } from '@/components/ThemedText';
import { styles } from './styles';


interface ScrollingTextProps {
    inputText: string;
    wpm: string;
    isPlaying: boolean;
    showIntro: boolean;
    onContentLayout: (event: any) => void;
    onScrollComplete: () => void;
    onPlay: () => void;
    onPause: () => void;
    onReset: () => void;
  }


// New component for the scrolling text functionality
export function ScrollingText({ 
    inputText, 
    wpm, 
    isPlaying, 
    showIntro,
    onContentLayout,
    onScrollComplete,
    onPlay,
    onPause,
    onReset 
  }: ScrollingTextProps) {
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