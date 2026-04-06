# VocalFlow for Windows

A Windows desktop app for **voice-to-text dictation** using **Deepgram** (speech-to-text) and **Groq** (AI text enhancement). Built with Electron.js.

This is a Windows clone of the original macOS [VocalFlow app](https://github.com/Vocallabsai/vocalflow).

## Features

- Real-time speech-to-text using Deepgram's Nova-2 model
- AI text enhancement (grammar/spelling fix) using Groq LLM
- Deepgram balance and Groq API status display
- System tray support (minimize to tray)
- Global hotkey (`Alt+Shift+V`) to toggle recording
- Multi-language support (English, Hindi, Spanish, French, German, Japanese, Chinese)
- Copy to clipboard

## Tech Stack

- **Electron.js** - Desktop app framework (basically Node.js + Chrome)
- **Deepgram API** - Speech-to-text via WebSocket
- **Groq API** - LLM text enhancement (OpenAI-compatible format)
- **HTML/CSS/JS** - Frontend (no frameworks)

## Project Structure

```
vocalflow-windows/
├── config/
│   └── default.json              # API keys and settings (edit this)
├── src/
│   ├── main/
│   │   ├── main.js               # Electron main process (window, tray, hotkey)
│   │   └── preload.js            # Bridge between main and renderer
│   └── renderer/
│       ├── index.html            # App UI
│       ├── styles.css            # Styling
│       ├── app.js                # Main app logic
│       ├── assets/
│       │   └── tray-icon.png     # System tray icon
│       └── services/
│           ├── audioCapture.js   # Microphone capture (Web Audio API)
│           ├── deepgram.js       # Deepgram WebSocket + balance API
│           └── groq.js           # Groq text enhancement + status API
├── package.json
├── .gitignore
└── README.md
```

## Setup

### Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **Deepgram API Key** - [Get free key](https://console.deepgram.com/) (comes with $200 free credit)
- **Groq API Key** (optional) - [Get free key](https://console.groq.com/)

### Steps

1. Clone this repo
   ```bash
   git clone https://github.com/Sanchit029/vocalflow.git
   cd vocalflow
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Add your API keys in `config/default.json`
   ```json
   {
     "deepgram": {
       "apiKey": "YOUR_DEEPGRAM_KEY"
     },
     "groq": {
       "apiKey": "YOUR_GROQ_KEY"
     }
   }
   ```

4. Run the app
   ```bash
   npm start
   ```

## How to Use

1. Run `npm start` to launch
2. Check your **Deepgram balance** and **Groq status** at the top
3. Click the **mic button** or press `Alt+Shift+V` to start recording
4. Speak into your microphone - text appears in real-time
5. Click again to stop
6. Toggle **AI Enhance** to fix grammar/spelling via Groq
7. Click **Copy** to copy text

## How It Works

1. **Audio Capture** - Web Audio API captures mic input, converts Float32 audio to 16-bit PCM at 16kHz
2. **Deepgram** - Audio streams to Deepgram via WebSocket, which returns transcription results
3. **Groq** (optional) - Transcribed text is sent to Groq's Llama model for grammar correction
4. **Balance Display** - App calls Deepgram's `/projects/{id}/balances` and Groq's `/models` endpoint

## Additional Notes

### Original macOS App vs This Windows Clone

The original VocalFlow is a native **Swift/macOS** app. Since Swift doesn't run on Windows, I rebuilt it using **Electron.js** (Node.js + Chromium), which is a common approach for cross-platform desktop apps.

| Original (macOS) | This Clone (Windows) |
|---|---|
| Swift + SwiftUI | Electron + HTML/CSS/JS |
| AVAudioEngine | Web Audio API |
| macOS Accessibility API | Electron globalShortcut |
| macOS Keychain | Config JSON file |
| Native menu bar | Electron system tray |

### What's Simplified

- **Credential storage** - Uses a plain JSON config file instead of OS keychain. In a real production app, you'd want something more secure.
- **Text injection** - Original app injects text directly into any active input field using macOS Accessibility APIs. This version uses copy-to-clipboard instead, since Electron doesn't have an equivalent cross-app text injection API.
- **Languages** - Supports 7 languages instead of 16+ in the original. Can be easily extended by adding more options to the dropdown.

## License

MIT
