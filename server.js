import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = 3000;

const providers = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    model: 'mistral-small-latest'
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  {
    name: 'HuggingFace',
    url: 'https://router.huggingface.co/v1/chat/completions',
    key: process.env.HF_API_KEY,
    model: 'meta-llama/Llama-3.1-8B-Instruct'
  }
];

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCostData(text) {
  const tokens = estimateTokens(text);

  return [
    {
      provider: 'Mistral Small',
      tokens,
      estimatedCost: (tokens * 0.20 / 1_000_000).toFixed(8) + '€'
    },
    {
      provider: 'Groq Llama 3',
      tokens,
      estimatedCost: (tokens * 0.05 / 1_000_000).toFixed(8) + '€'
    },
    {
      provider: 'GPT-4o',
      tokens,
      estimatedCost: (tokens * 2.50 / 1_000_000).toFixed(8) + '€'
    }
  ];
}

async function checkProvider(provider) {
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
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: provider.label,
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      provider: provider.label,
      status: 'OK',
      latency
    };

  } catch (error) {
    return {
      provider: provider.label,
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}


async function checkPinecone() {
  const start = Date.now();

  try {
    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'X-Pinecone-API-Version': '2024-07'
      }
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: 'Pinecone',
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      provider: 'Pinecone',
      status: 'OK',
      latency
    };

  } catch (error) {
    return {
      provider: 'Pinecone',
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}


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
        provider: provider.label,
        error: `HTTP ${response.status}`,
        latency
      };
    }

    const data = await response.json();

    return {
      provider: provider.label,
      response: data.choices?.[0]?.message?.content || '',
      latency
    };

  } catch (error) {
    return {
      provider: provider.label,
      error: error.message
    };
  }
}


app.get('/check', async (req, res) => {
  const results = await Promise.all([
    ...providers.map(checkProvider),
    checkPinecone()
  ]);

  res.json(results);
});


app.get('/ask', async (req, res) => {
  const { q, provider } = req.query;

  if (!q || !provider) {
    return res.status(400).json({ error: 'Missing q or provider' });
  }

  const p = providers.find(p => p.name === provider.toLowerCase());

  if (!p) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const result = await callProvider(p, q);

  res.json(result);
});


app.get('/cost', (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  const result = estimateCostData(text);

  res.json(result);
});


app.listen(PORT, () => {
  console.log(` Serveur démarré sur http://localhost:${PORT}`);
});
