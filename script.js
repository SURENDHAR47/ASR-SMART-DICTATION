// Section 1: Elements & Transcript Utilities
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const punctCheck = document.getElementById('punctCheck');
const statusEl = document.getElementById('status');
const textBox = document.getElementById('textBox');
const wordCountEl = document.getElementById('wordCount');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const clearBtn = document.getElementById('clearBtn');
const speakNormalBtn = document.getElementById('speakNormalBtn');
const styleSelect = document.getElementById('styleSelect');
const speakStyleBtn = document.getElementById('speakStyleBtn');
const keepWords = document.getElementById('keepWords');

function updateStats() {
  const text = textBox.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCountEl.textContent = `${words} words | ${textBox.value.length} chars`;
}

function formatPunctuation(str) {
  if (!punctCheck || !punctCheck.checked) return str;
  return str
    .replace(/\s*\bperiod\b/gi, '.')
    .replace(/\s*\bcomma\b/gi, ',')
    .replace(/\s*\bquestion mark\b/gi, '?')
    .replace(/\s*\bexclamation mark\b/gi, '!');
}

textBox.addEventListener('input', updateStats);

copyBtn.addEventListener('click', () => {
  if (textBox.value.trim() && navigator.clipboard) {
    navigator.clipboard.writeText(textBox.value);
    statusEl.textContent = 'Copied transcript to clipboard.';
  }
});

clearBtn.addEventListener('click', () => {
  textBox.value = '';
  baseText = '';
  updateStats();
});

downloadBtn.addEventListener('click', () => {
  const content = textBox.value.trim();
  if (!content) return;
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'transcript.txt';
  a.click();
});

// Section 2: Speech to Text (Web Speech API)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let baseText = '';

if (!SpeechRecognition) {
  statusEl.textContent = 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
  startBtn.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    statusEl.textContent = 'Listening... speak now';
    startBtn.disabled = true;
    stopBtn.disabled = false;
  };

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    const formatted = formatPunctuation(transcript.trim());
    textBox.value = baseText ? `${baseText} ${formatted}` : formatted;
    updateStats();
  };

  recognition.onerror = (event) => {
    const errorMessages = {
      'not-allowed': 'Microphone access blocked. Click the lock icon beside the address bar and allow the microphone.',
      'service-not-allowed': 'Microphone access blocked. Click the lock icon beside the address bar and allow the microphone.',
      'network': 'Network error. Check your internet connection for speech recognition.',
      'audio-capture': 'No microphone found. Please connect a microphone and try again.',
      'no-speech': 'No speech heard. Please speak clearly into the microphone.'
    };
    statusEl.textContent = errorMessages[event.error] || `Error: ${event.error}`;
  };

  recognition.onend = () => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (statusEl.textContent === 'Listening... speak now') {
      statusEl.textContent = 'Not listening';
    }
  };

  startBtn.addEventListener('click', () => {
    baseText = textBox.value.trim();
    recognition.start();
  });

  stopBtn.addEventListener('click', () => {
    recognition.stop();
  });
}

// Section 3: Text to Speech (SpeechSynthesis)
let voices = [];

function loadVoices() {
  if (!window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}

if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice() {
  loadVoices();
  return (
    voices.find((v) => v.lang.startsWith('en') && v.localService) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0] ||
    null
  );
}

function speak(text, pitch = 1, rate = 1) {
  const clean = text.trim();
  if (!clean || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const chosenVoice = pickVoice();
  if (chosenVoice) utterance.voice = chosenVoice;
  utterance.pitch = pitch;
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}

speakNormalBtn.addEventListener('click', () => {
  speak(textBox.value, 1, 1);
});

// Section 4: Character Voice Style Presets
const styles = {
  robot:     { sound: 'beep',   pitch: 0.5, rate: 0.9  },
  chipmunk:  { sound: 'squeak', pitch: 2.0, rate: 1.4  },
  narrator:  { sound: 'hmm',    pitch: 0.4, rate: 0.75 },
  announcer: { sound: 'boom',   pitch: 1.3, rate: 1.3  },
  whisper:   { sound: 'shhh',   pitch: 1.6, rate: 0.8  }
};

speakStyleBtn.addEventListener('click', () => {
  const text = textBox.value.trim();
  if (!text) return;

  const selected = styleSelect.value;
  if (!selected || !styles[selected]) {
    alert('Please choose a voice style first.');
    return;
  }

  const preset = styles[selected];
  const words = text.split(/\s+/);
  const outputText = keepWords.checked
    ? text
    : words.map(() => preset.sound).join(', ');

  speak(outputText, preset.pitch, preset.rate);
});