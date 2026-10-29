# 🎙️ ASR Smart Dictation & Voice Style System

A lightweight, browser-based **Automatic Speech Recognition (ASR)** and **Text-to-Speech (TTS)** web application built with **HTML5, CSS3, and JavaScript** using the browser's built-in **Web Speech API**. It requires no backend server, no database, no external libraries, and no API key.

---

## ✨ Features

- **Real-Time Speech-to-Text (ASR):** Continuous microphone dictation (`en-US`) with live interim results and session history preservation.
- **Smart Spoken Punctuation:** Automatically converts spoken punctuation words (`"period"`, `"comma"`, `"question mark"`, `"exclamation mark"`) into symbols.
- **Transcript Tools:** Live word & character counter, plus one-click **Copy**, **Download `.txt`**, and **Clear** buttons.
- **Normal Text-to-Speech:** Reads typed or dictated text aloud at standard pitch (`1.0`) and rate (`1.0`) using a local English voice.
- **5 Character Voice Styles:** Choose between **Robot Assistant**, **Chipmunk Cartoon**, **Deep Narrator**, **Sports Announcer**, and **Mystery Whisper**—either replacing words with the character's sound cue or checking **"Keep my words"** to modify only pitch and rate.
- **Transparent Error Handling:** Clear diagnostic messages for blocked microphones, network loss, missing audio hardware, silent input, and unsupported browsers.

---

## 🛠️ Tools & Technologies Used

| Component | Technology |
| :--- | :--- |
| **Structure & Styling** | HTML5, CSS3 |
| **Application Logic** | Vanilla JavaScript (ES6+) |
| **ASR & TTS Engines** | Web Speech API (`SpeechRecognition`, `SpeechSynthesis`) |
| **Development Environment** | Visual Studio Code + Live Server Extension |
| **Testing** | Playwright (13 Automated Headless Chromium Tests) |

---

## 🚀 Instructions to Run the Project

### Method 1: Using VS Code Live Server (Recommended)
1. Clone this repository:
   ```bash
   git clone [https://github.com/](https://github.com/)<YOUR_GITHUB_USERNAME>/ASR-SMART-DICTATION.git
   cd ASR-SMART-DICTATION
   ```
2. Open the `ASR-SMART-DICTATION` folder in **VS Code**.
3. Install the **Live Server** extension by *Ritwick Dey*.
4. Right-click `index.html` and select **"Open with Live Server"** (or click **"Go Live"** in the bottom-right corner).
5. Open the URL (`http://127.0.0.1:5500`) in **Google Chrome** or **Microsoft Edge**, click **Start Speaking**, and allow microphone access.

### Method 2: Using Python Local HTTP Server
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in Chrome or Edge.

### Running the 13 Automated Playwright Tests
```bash
npm install
npx playwright install chromium
npx playwright test
```