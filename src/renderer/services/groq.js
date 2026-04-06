// Groq Service
// Handles text enhancement using Groq's LLM API
// Groq uses OpenAI-compatible API format, so it's similar to calling ChatGPT
// Reference: https://console.groq.com/docs/api-reference

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

// Send transcribed text to Groq LLM to fix grammar and spelling
async function enhanceTextWithGroq(apiKey, rawText, model = 'llama-3.3-70b-versatile') {
  if (!rawText || rawText.trim() === '') return rawText;

  try {
    const response = await fetch(GROQ_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a text correction assistant. Fix any spelling, grammar, and punctuation errors in the user\'s dictated text. Keep the original meaning and tone. Only return the corrected text, nothing else.'
          },
          {
            role: 'user',
            content: rawText
          }
        ],
        max_tokens: 1024,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || 'HTTP ' + response.status);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || rawText;

  } catch (err) {
    console.error('Groq enhancement error:', err);
    throw err;
  }
}

// Check Groq API status
// Groq doesn't have a direct "balance" endpoint for free tier
// So we call the /models endpoint to verify API key works and get rate limit info
async function getGroqStatus(apiKey) {
  try {
    const response = await fetch(GROQ_BASE_URL + '/models', {
      headers: { 'Authorization': 'Bearer ' + apiKey }
    });

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const modelCount = data.data?.length || 0;

    return {
      status: 'Active',
      modelsAvailable: modelCount
    };
  } catch (err) {
    console.error('Failed to fetch Groq status:', err);
    return { status: 'Error', error: err.message };
  }
}
