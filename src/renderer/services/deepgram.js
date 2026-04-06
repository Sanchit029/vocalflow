// Deepgram Service
// Handles speech-to-text using Deepgram's WebSocket API
// Reference: https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio

let dgSocket = null;
let dgConnected = false;

// callbacks - set these from app.js before calling connectDeepgram()
let onTranscriptReceived = null;
let onDgError = null;
let onDgOpen = null;
let onDgClose = null;

function connectDeepgram(apiKey, language = 'en') {
  // Deepgram WebSocket URL with query params for config
  // Using token param because browser WebSocket doesn't support custom headers
  const url = 'wss://api.deepgram.com/v1/listen'
    + '?model=nova-2'
    + '&language=' + language
    + '&smart_format=true'
    + '&interim_results=true'
    + '&utterance_end_ms=1000'
    + '&vad_events=true'
    + '&encoding=linear16'
    + '&sample_rate=16000'
    + '&channels=1'
    + '&token=' + apiKey;

  // close old connection if any
  if (dgSocket) {
    dgSocket.close();
  }

  dgSocket = new WebSocket(url);

  dgSocket.onopen = function () {
    dgConnected = true;
    console.log('Connected to Deepgram');
    if (onDgOpen) onDgOpen();
  };

  dgSocket.onmessage = function (event) {
    try {
      const response = JSON.parse(event.data);

      // Deepgram sends back results with transcript in channel.alternatives
      if (response.type === 'Results' && response.channel) {
        const transcript = response.channel.alternatives[0]?.transcript || '';
        const isFinal = response.is_final;

        if (onTranscriptReceived) {
          onTranscriptReceived(transcript, isFinal);
        }
      }
    } catch (err) {
      console.error('Error parsing Deepgram response:', err);
    }
  };

  dgSocket.onerror = function (error) {
    console.error('Deepgram WebSocket error:', error);
    if (onDgError) onDgError(error);
  };

  dgSocket.onclose = function () {
    dgConnected = false;
    console.log('Deepgram disconnected');
    if (onDgClose) onDgClose();
  };
}

function sendAudioToDeepgram(audioData) {
  if (dgSocket && dgConnected && dgSocket.readyState === WebSocket.OPEN) {
    dgSocket.send(audioData);
  }
}

function disconnectDeepgram() {
  if (dgSocket) {
    dgSocket.close();
    dgSocket = null;
    dgConnected = false;
  }
}

// Fetch Deepgram account balance
// API docs: https://developers.deepgram.com/reference/get-all-balances
async function getDeepgramBalance(apiKey) {
  try {
    // Step 1: Get project ID (every Deepgram account has at least one project)
    const projectsRes = await fetch('https://api.deepgram.com/v1/projects', {
      headers: { 'Authorization': 'Token ' + apiKey }
    });

    if (!projectsRes.ok) throw new Error('HTTP ' + projectsRes.status);

    const projectsData = await projectsRes.json();
    const projectId = projectsData.projects[0]?.project_id;

    if (!projectId) throw new Error('No project found');

    // Step 2: Get balance for that project
    const balanceRes = await fetch(
      'https://api.deepgram.com/v1/projects/' + projectId + '/balances',
      { headers: { 'Authorization': 'Token ' + apiKey } }
    );

    if (!balanceRes.ok) throw new Error('HTTP ' + balanceRes.status);

    const balanceData = await balanceRes.json();
    const balance = balanceData.balances[0];

    return {
      amount: balance?.amount ?? 'N/A',
      units: balance?.units ?? ''
    };
  } catch (err) {
    console.error('Failed to fetch Deepgram balance:', err);
    return { amount: 'Error', error: err.message };
  }
}
