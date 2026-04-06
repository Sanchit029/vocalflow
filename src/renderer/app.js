// Main App Logic
// Connects all the pieces together: audio capture -> deepgram -> display

// App state
let config = null;
let isRecording = false;
let fullTranscript = '';

// DOM elements
const recordBtn = document.getElementById('recordBtn');
const recordText = document.getElementById('recordText');
const finalText = document.getElementById('finalText');
const interimText = document.getElementById('interimText');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const enhanceToggle = document.getElementById('enhanceToggle');
const languageSelect = document.getElementById('languageSelect');
const hotkeyDisplay = document.getElementById('hotkeyDisplay');

// Balance display elements
const deepgramBalanceEl = document.getElementById('deepgramBalance');
const deepgramLabelEl = document.getElementById('deepgramLabel');
const deepgramStatusEl = document.getElementById('deepgramStatus');
const groqBalanceEl = document.getElementById('groqBalance');
const groqLabelEl = document.getElementById('groqLabel');
const groqStatusEl = document.getElementById('groqStatus');

// Initialize the app
async function initApp() {
  // Get config from main process (has the API keys)
  try {
    config = await window.electronAPI.getConfig();
  } catch (err) {
    console.warn('Could not get config from main process');
    config = {
      deepgram: { apiKey: '', model: 'nova-2', language: 'en' },
      groq: { apiKey: '', model: 'llama-3.3-70b-versatile' },
      app: { hotkey: 'Alt+Shift+V' }
    };
  }

  hotkeyDisplay.textContent = config.app.hotkey;

  // Setup event listeners
  recordBtn.addEventListener('click', toggleRecording);
  copyBtn.addEventListener('click', copyToClipboard);
  clearBtn.addEventListener('click', clearText);

  languageSelect.addEventListener('change', function () {
    // Language will be used on next recording session
    console.log('Language changed to:', languageSelect.value);
  });

  // Listen for hotkey from main process
  if (window.electronAPI.onToggleRecording) {
    window.electronAPI.onToggleRecording(toggleRecording);
  }

  // Load balances
  loadBalances();
}

// Fetch and display API balances
async function loadBalances() {
  // Deepgram balance
  if (config.deepgram.apiKey && config.deepgram.apiKey !== 'YOUR_DEEPGRAM_API_KEY_HERE') {
    const balance = await getDeepgramBalance(config.deepgram.apiKey);

    if (balance.error) {
      deepgramBalanceEl.textContent = 'Error';
      deepgramLabelEl.textContent = balance.error;
      deepgramStatusEl.className = 'status-dot error';
    } else {
      deepgramBalanceEl.textContent = '$' + parseFloat(balance.amount).toFixed(2);
      deepgramLabelEl.textContent = 'Credits remaining';
      deepgramStatusEl.className = 'status-dot active';
    }
  } else {
    deepgramBalanceEl.textContent = 'No Key';
    deepgramLabelEl.textContent = 'Add key in config/default.json';
    deepgramStatusEl.className = 'status-dot error';
  }

  // Groq status
  if (config.groq.apiKey && config.groq.apiKey !== 'YOUR_GROQ_API_KEY_HERE') {
    const groqInfo = await getGroqStatus(config.groq.apiKey);

    if (groqInfo.error) {
      groqBalanceEl.textContent = 'Error';
      groqLabelEl.textContent = groqInfo.error;
      groqStatusEl.className = 'status-dot error';
    } else {
      groqBalanceEl.textContent = groqInfo.status;
      groqLabelEl.textContent = groqInfo.modelsAvailable + ' models available';
      groqStatusEl.className = 'status-dot active';
    }
  } else {
    groqBalanceEl.textContent = 'No Key';
    groqLabelEl.textContent = 'Add key in config/default.json';
    groqStatusEl.className = 'status-dot error';
  }
}

// Toggle recording on/off
async function toggleRecording() {
  if (isRecording) {
    stopRecordingSession();
  } else {
    await startRecordingSession();
  }
}

// Start recording
async function startRecordingSession() {
  try {
    // Set up Deepgram callbacks
    onTranscriptReceived = function (transcript, isFinal) {
      if (isFinal && transcript) {
        fullTranscript += transcript + ' ';
        finalText.value = fullTranscript;
        interimText.textContent = '';
        finalText.scrollTop = finalText.scrollHeight;
      } else if (transcript) {
        interimText.textContent = transcript;
      }
    };

    onDgError = function () {
      stopRecordingSession();
    };

    // Connect to Deepgram
    const language = languageSelect.value || config.deepgram.language;
    connectDeepgram(config.deepgram.apiKey, language);

    // Start capturing audio from microphone
    await startAudioCapture();

    // Send audio chunks to Deepgram as they come in
    onAudioChunk = function (audioData) {
      sendAudioToDeepgram(audioData);
    };

    // Update UI
    isRecording = true;
    recordBtn.classList.add('recording');
    recordText.textContent = 'Recording... Click to Stop';

  } catch (err) {
    console.error('Failed to start recording:', err);
    alert('Could not start recording. Please allow microphone access.');
  }
}

// Stop recording
async function stopRecordingSession() {
  isRecording = false;
  stopAudioCapture();
  disconnectDeepgram();
  interimText.textContent = '';

  // Update UI
  recordBtn.classList.remove('recording');
  recordText.textContent = 'Click to Record';

  // If AI enhance is toggled on, send text to Groq for improvement
  if (enhanceToggle.checked && fullTranscript.trim()) {
    recordText.textContent = 'Enhancing with AI...';
    recordBtn.disabled = true;

    try {
      const enhanced = await enhanceTextWithGroq(
        config.groq.apiKey,
        fullTranscript.trim(),
        config.groq.model
      );
      fullTranscript = enhanced + ' ';
      finalText.value = fullTranscript;
    } catch (err) {
      console.error('AI enhancement failed, keeping original text');
    }

    recordBtn.disabled = false;
    recordText.textContent = 'Click to Record';
  }
}

// Copy transcription to clipboard
function copyToClipboard() {
  const text = finalText.value.trim();
  if (!text) return;

  navigator.clipboard.writeText(text).then(function () {
    // Show a quick checkmark to confirm copy
    const original = copyBtn.innerHTML;
    copyBtn.textContent = 'Copied!';
    setTimeout(function () { copyBtn.innerHTML = original; }, 1500);
  });
}

// Clear all text
function clearText() {
  fullTranscript = '';
  finalText.value = '';
  interimText.textContent = '';
}

// Start the app when page loads
document.addEventListener('DOMContentLoaded', initApp);
