import 'dotenv/config';

const PROMPT = "Les phrases de livres célèbres sont des répliques qui ont marqué la culture et la littérature. Elles sont souvent utilisées pour exprimer des idées profondes, des sentiments universels ou des réflexions sur la vie.";

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

const temperatures = [0, 0.5, 1];

async function callProvider(provider, prompt, temperature) {
  try {
    const temp = provider.name === 'HuggingFace' && temperature === 0
      ? 0.01
      : temperature;

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temp,
        max_tokens: 60
      })
    });

    if (!response.ok) {
      return {
        provider: provider.name,
        temperature,
        content: null,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

    let content = '';

    if (provider.name === 'HuggingFace') {
      content = data.choices?.[0]?.message?.content || '';
    } else {
      content = data.choices?.[0]?.message?.content || '';
    }

    return {
      provider: provider.name,
      temperature,
      content
    };

  } catch (error) {
    return {
      provider: provider.name,
      temperature,
      content: null,
      error: error.message
    };
  }
}

const tasks = providers.flatMap(provider =>
  temperatures.map(temp =>
    callProvider(provider, PROMPT, temp)
  )
);

const results = await Promise.all(tasks);

console.log(`\n Prompt Lab\n`);
console.log(`Prompt : "${PROMPT}"\n`);
console.log('─'.repeat(60));

for (const r of results) {
  const label = `${r.provider.padEnd(12)} | temp ${r.temperature}`;

  if (r.error) {
    console.log(` ${label} → ${r.error}`);
  } else {
    console.log(`\n${label}`);
    console.log(`→ ${r.content}`);
  }
}

console.log('\n' + '─'.repeat(60));