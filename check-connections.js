import 'dotenv/config';

function checkEnv() {
  const keys = [
    'MISTRAL_API_KEY',
    'GROQ_API_KEY',
    'HF_API_KEY'
  ];

  keys.forEach((key) => {
    if (process.env[key]) {
      console.log(`${key}: présente`);
    } else {
      console.log(`${key}: manquante`);
    }
  });
}

checkEnv();



const providers = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5
    })
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile',
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5
    })
  },
  {
    name: 'HuggingFace',
    url: 'https://router.huggingface.co/v1/chat/completions',
    key: process.env.HF_API_KEY,
    model: 'meta-llama/Llama-3.1-8B-Instruct',
    body: (model) => ({
      model,
      messages: [
      { role: 'user', content: 'ping' }
    ],
    max_tokens: 5
  })
}
];

async function checkProvider(provider) {
  const start = Date.now();

  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify(provider.body(provider.model || 'mistral-small-latest'))
    });

    const latency = Date.now() - start;
    const data = await response.json();

    if (!response.ok) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    return {
      provider: provider.name,
      status: 'OK',
      latency
    };

  } catch (error) {
    return {
      provider: provider.name,
      status: 'ERROR',
      latency: Date.now() - start,
      error: error.message
    };
  }
}

const results = await Promise.all(
  providers.map(checkProvider)
);

displayResult(results);


function displayResult(results) {
  console.log('\n🔍 Vérification des connexions API...\n');

  let success = 0;

  for (const r of results) {
    const ok = r.status === 'OK';

    if (ok) success++;

    const icon = ok ? '✅' : '❌';

    console.log(
      `${icon} ${r.provider.padEnd(15)} ${r.latency}ms`
    );
  }

  console.log(`\n${success}/${results.length} connexions actives\n`);

  if (success === results.length) {
    console.log('Tout est vert. Vous êtes prêts pour la suite !');
  } else {
    console.log('Certaines connexions sont en erreur.');
  }
}