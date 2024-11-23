import { useState, useRef } from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { ThemedText } from '@/components/ThemedText';
import { styles } from './styles';

interface ReadingCameraProps {
  permission: any;
  audioPermission: any;
  requestPermission: () => void;
  requestAudioPermission: () => void;
}


// New component for the camera functionality
export function ReadingCamera({ 
    permission, 
    audioPermission, 
    requestPermission, 
    requestAudioPermission 
  }: ReadingCameraProps) {
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
  