// Audio Capture Service
// Uses Web Audio API to capture microphone audio
// Converts it to the format Deepgram expects (16-bit PCM, 16kHz, mono)
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

let audioStream = null;
let audioContext = null;
let audioProcessor = null;
let audioSource = null;
let isCapturing = false;

// callback - gets called with audio data chunks
let onAudioChunk = null;

async function startAudioCapture() {
  // Request microphone access
  audioStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      sampleRate: 16000,
      echoCancellation: true,
      noiseSuppression: true
    }
  });

  // Create audio context at 16kHz (what Deepgram expects)
  audioContext = new AudioContext({ sampleRate: 16000 });
  audioSource = audioContext.createMediaStreamSource(audioStream);

  // ScriptProcessorNode processes audio in chunks
  // 4096 = buffer size, 1 = input channels, 1 = output channels
  audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);

  audioProcessor.onaudioprocess = function (event) {
    if (!isCapturing) return;

    // Get raw audio data (float32 format, values between -1 and 1)
    const floatData = event.inputBuffer.getChannelData(0);

    // Convert to 16-bit integers (what Deepgram needs)
    // This is a standard conversion - found in Deepgram's browser example
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const sample = Math.max(-1, Math.min(1, floatData[i]));
      pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }

    if (onAudioChunk) {
      onAudioChunk(pcmData.buffer);
    }
  };

  // Connect: microphone -> processor -> output (needed for processor to work)
  audioSource.connect(audioProcessor);
  audioProcessor.connect(audioContext.destination);
  isCapturing = true;
}

function stopAudioCapture() {
  isCapturing = false;

  if (audioProcessor) {
    audioProcessor.disconnect();
    audioProcessor = null;
  }
  if (audioSource) {
    audioSource.disconnect();
    audioSource = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (audioStream) {
    // Stop all audio tracks to release the microphone
    audioStream.getTracks().forEach(function (track) { track.stop(); });
    audioStream = null;
  }
}
