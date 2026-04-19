import 'dotenv/config';

const PROMPT = "Explique le machine learning en 2 phrases.";

const GROQ = {
  name: 'Groq',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  key: process.env.GROQ_API_KEY,
  model: 'llama-3.3-70b-versatile'
};

const HF = {
  name: 'HuggingFace',
  url: 'https://router.huggingface.co/v1/chat/completions',
  key: process.env.HF_API_KEY,
  model: 'meta-llama/Llama-3.1-8B-Instruct'
};

async function callProvider(provider, prompt) {
  const start = Date.now();

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        content: null,
        latency,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      latency
    };

  } catch (error) {
    return {
      content: null,
      latency: Date.now() - start,
      error: error.message
    };
  }
}

async function compareSameModel(prompt) {
  const [groqRes, hfRes] = await Promise.all([
    callProvider(GROQ, prompt),
    callProvider(HF, prompt)
  ]);

  let diff = '';

  if (groqRes.latency && hfRes.latency) {
    const ratio = (hfRes.latency / groqRes.latency).toFixed(1);
    diff = `Groq est ~${ratio}x plus rapide`;
  }

  return {
    groq: groqRes,
    huggingface: hfRes,
    diff
  };
}

const result = await compareSameModel(PROMPT);

console.log(`\n Prompt : "${PROMPT}"\n`);

console.log(`⚡ Groq (Llama) :`);
console.log(`${result.groq.latency}ms`);
console.log(result.groq.content || result.groq.error);

console.log('\n-----------------------------------\n');

console.log(` HuggingFace (Llama) :`);
console.log(`${result.huggingface.latency}ms`);
console.log(result.huggingface.content || result.huggingface.error);

console.log('\n-----------------------------------\n');

console.log(` Comparaison :`);
console.log(result.diff);