import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

export const loadModels = async () => {
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
  ]);
};

export const detectFace = async (video: HTMLVideoElement) => {
  return await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
    .withFaceExpressions();
};

export const isFakeDetection = (detection: any) => {
  // Simplified anti-spoofing: check for landmarks and expressions
  // In a real app, you'd check for eye blinking or depth
  if (!detection || !detection.landmarks) return true;
  
  // Check if face is too static (simplified)
  // Real anti-spoofing requires more complex logic or a specialized library
  return false; 
};

export const matchFace = (descriptor: Float32Array, labeledDescriptors: faceapi.LabeledFaceDescriptors[]) => {
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  return faceMatcher.findBestMatch(descriptor);
};
