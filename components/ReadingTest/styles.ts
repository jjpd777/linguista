import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
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
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#0a7ea4',
    minWidth: 140,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  readingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  textWrapper: {
    height: 200,
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
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    aspectRatio: 16 / 9,
    alignSelf: 'center',
  },
  recordButtonContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: '10%',
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
  retakeButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.8)',
    flex: 1,
    maxWidth: 150,
  },
  saveButton: {
    backgroundColor: 'rgba(40, 167, 69, 0.8)',
    flex: 1,
    maxWidth: 150,
  },
});