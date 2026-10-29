const { test, expect } = require('@playwright/test');
const path = require('path');

const fileUrl = 'file://' + path.resolve(__dirname, '../index.html');

async function setupWithMocks(page) {
  await page.addInitScript(() => {
    window.spokenUtterances = [];
    window.lastRecognizer = null;

    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.lang = 'en-US';
        window.lastRecognizer = this;
      }
      start() {
        if (this.onstart) this.onstart();
      }
      stop() {
        if (this.onend) this.onend();
      }
    }

    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;

    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
        this.pitch = 1;
        this.rate = 1;
        this.voice = null;
      }
    };

    const mockVoices = [
      { name: 'Online English', lang: 'en-US', localService: false },
      { name: 'Local English', lang: 'en-US', localService: true }
    ];

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: {
        getVoices: () => mockVoices,
        cancel: () => {},
        speak: (u) => {
          window.spokenUtterances.push({
            text: u.text,
            pitch: u.pitch,
            rate: u.rate,
            voiceName: u.voice ? u.voice.name : null
          });
        }
      }
    });
  });
}

test.describe('ASR Smart Dictation & Voice Style System - 13 QA Tests', () => {
  test('1. Page loads with no console or script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e));
    await setupWithMocks(page);
    await page.goto(fileUrl);
    expect(errors.length).toBe(0);
  });

  test('2. Start Speaking shows Listening status and enables Stop', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.click('#startBtn');
    await expect(page.locator('#status')).toHaveText('Listening... speak now');
    await expect(page.locator('#startBtn')).toBeDisabled();
    await expect(page.locator('#stopBtn')).toBeEnabled();
  });

  test('3. Recognized speech is written into the text box', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.click('#startBtn');
    await page.evaluate(() => {
      window.lastRecognizer.onresult({
        results: [[{ transcript: 'hello world period' }]]
      });
    });
    await expect(page.locator('#textBox')).toHaveValue('hello world.');
  });

  test('4. Stop ends listening and resets both buttons', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.click('#startBtn');
    await page.click('#stopBtn');
    await expect(page.locator('#status')).toHaveText('Not listening');
    await expect(page.locator('#startBtn')).toBeEnabled();
    await expect(page.locator('#stopBtn')).toBeDisabled();
  });

  test('5. Earlier text is kept when a new listening session starts', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'First sentence.');
    await page.click('#startBtn');
    await page.evaluate(() => {
      window.lastRecognizer.onresult({
        results: [[{ transcript: 'Second sentence' }]]
      });
    });
    await expect(page.locator('#textBox')).toHaveValue('First sentence. Second sentence');
  });

  test('6. Speak Normally sends the text at pitch 1 and rate 1', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'Testing normal speech');
    await page.click('#speakNormalBtn');
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken[0].text).toBe('Testing normal speech');
    expect(spoken[0].pitch).toBe(1);
    expect(spoken[0].rate).toBe(1);
  });

  test('7. A local English voice is preferred over an online voice', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'Check voice');
    await page.click('#speakNormalBtn');
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken[0].voiceName).toBe('Local English');
  });

  test('8. All 5 voice styles replace each word with their sound at their own pitch and rate', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'one two three');
    const expected = [
      { key: 'robot', text: 'beep, beep, beep', pitch: 0.5, rate: 0.9 },
      { key: 'chipmunk', text: 'squeak, squeak, squeak', pitch: 2.0, rate: 1.4 },
      { key: 'narrator', text: 'hmm, hmm, hmm', pitch: 0.4, rate: 0.75 },
      { key: 'announcer', text: 'boom, boom, boom', pitch: 1.3, rate: 1.3 },
      { key: 'whisper', text: 'shhh, shhh, shhh', pitch: 1.6, rate: 0.8 }
    ];
    for (const item of expected) {
      await page.selectOption('#styleSelect', item.key);
      await page.click('#speakStyleBtn');
    }
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken.length).toBe(5);
    expected.forEach((item, idx) => {
      expect(spoken[idx].text).toBe(item.text);
      expect(spoken[idx].pitch).toBe(item.pitch);
      expect(spoken[idx].rate).toBe(item.rate);
    });
  });

  test('9. Keep my words speaks the original words with the chosen style voice', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'hello how are you');
    await page.check('#keepWords');
    await page.selectOption('#styleSelect', 'robot');
    await page.click('#speakStyleBtn');
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken[0].text).toBe('hello how are you');
    expect(spoken[0].pitch).toBe(0.5);
    expect(spoken[0].rate).toBe(0.9);
  });

  test('10. Speak in Style without choosing a style shows an alert and speaks nothing', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', 'hello world');
    let alertMsg = '';
    page.on('dialog', async (dialog) => {
      alertMsg = dialog.message();
      await dialog.dismiss();
    });
    await page.click('#speakStyleBtn');
    expect(alertMsg).toContain('Please choose a voice style first');
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken.length).toBe(0);
  });

  test('11. Empty text is ignored by both Speak buttons', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.fill('#textBox', '   ');
    await page.click('#speakNormalBtn');
    await page.selectOption('#styleSelect', 'robot');
    await page.click('#speakStyleBtn');
    const spoken = await page.evaluate(() => window.spokenUtterances);
    expect(spoken.length).toBe(0);
  });

  test('12. Each recognition error shows its own clear message', async ({ page }) => {
    await setupWithMocks(page);
    await page.goto(fileUrl);
    await page.click('#startBtn');
    const cases = [
      { code: 'not-allowed', match: 'Microphone access blocked' },
      { code: 'network', match: 'Network error' },
      { code: 'audio-capture', match: 'No microphone found' },
      { code: 'no-speech', match: 'No speech heard' }
    ];
    for (const c of cases) {
      await page.evaluate((errCode) => {
        window.lastRecognizer.onerror({ error: errCode });
      }, c.code);
      await expect(page.locator('#status')).toContainText(c.match);
    }
  });

  test('13. Unsupported browser shows a message and disables Start Speaking', async ({ page }) => {
    await page.addInitScript(() => {
      delete window.SpeechRecognition;
      delete window.webkitSpeechRecognition;
    });
    await page.goto(fileUrl);
    await expect(page.locator('#status')).toContainText('not supported');
    await expect(page.locator('#startBtn')).toBeDisabled();
  });
});