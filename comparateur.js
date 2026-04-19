import 'dotenv/config';

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


const PROMPTS = [
  {
    type: 'traduction',
    text: 'Traduis en anglais : Le chat dort sur le canapé.'
  },
  {
    type: 'résumé',
    text: 'Résume en une phrase : Les LLMs sont des modèles entraînés sur de grandes quantités de texte pour comprendre et générer du langage.'
  },
  {
    type: 'code',
    text: 'Écris une fonction JavaScript qui inverse une chaîne.'
  },
  {
    type: 'créatif',
    text: 'Donne une métaphore originale pour expliquer un LLM.'
  },
  {
    type: 'factuel',
    text: 'Qui a inventé le Transformer en 2017 ?'
  }
];

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
        temperature: 0.3,
        max_tokens: 100
      })
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        provider: provider.name,
        content: null,
        latency,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    return {
      provider: provider.name,
      content: data.choices?.[0]?.message?.content || '',
      latency
    };

  } catch (error) {
    return {
      provider: provider.name,
      content: null,
      latency: Date.now() - start,
      error: error.message
    };
  }
}

const results = await Promise.all(
  PROMPTS.flatMap(p =>
    providers.map(provider =>
      callProvider(provider, p.text).then(res => ({
        type: p.type,
        provider: res.provider,
        content: res.content,
        latency: res.latency,
        error: res.error
      }))
    )
  )
);

const table = {};

for (const r of results) {
  if (!table[r.type]) {
    table[r.type] = {};
  }

  table[r.type][r.provider] = r.content || ` ${r.error}`;
}

console.log('\n| Type | Mistral | HuggingFace | Groq |');
console.log('|------|---------|-------------|------|');

for (const type of Object.keys(table)) {
  const mistral = table[type]['Mistral'] || '';
  const hf = table[type]['HuggingFace'] || '';
  const groq = table[type]['Groq'] || '';

  console.log(
    `| ${type} | ${truncate(mistral)} | ${truncate(hf)} | ${truncate(groq)} |`
  );
}

function truncate(text, max = 60) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}