const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API key...');
  const key = 'AIzaSyCzzQ-q294TeliX-opmB8k2e8ZETDF6B9U';
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Say hello in one word');
    console.log('Gemini success!');
    console.log('Response:', result.response.text());
  } catch (err) {
    console.error('Gemini failed:', err);
  }
}

testGemini();
