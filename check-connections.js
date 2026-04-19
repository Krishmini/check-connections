import 'dotenv/config';

function checkEnv() {
  const keys = [
    'MISTRAL_API_KEY',
    'GROQ_API_KEY',
    'HF_API_KEY',
    'PINECONE_API_KEY'
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


const VERBOSE = process.argv.includes('--verbose');

const TEST_PROMPT = VERBOSE
  ? "Donne-moi la capitale de la France en un mot."
  : "ping";


const providers = [
  {
    name: 'Mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    key: process.env.MISTRAL_API_KEY,
    body: (model) => ({
      model,
      messages: [{ role: 'user', content: TEST_PROMPT }],
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
      messages: [{ role: 'user', content: TEST_PROMPT }],
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
      { role: 'user', content: TEST_PROMPT }
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

    if (!response.ok) {
      return {
        provider: provider.name,
        status: 'ERROR',
        latency,
        error: `HTTP ${response.status}`
      };
    }

    const data = await response.json();

return {
  provider: provider.name,
  status: 'OK',
  latency,
  content: data.choices?.[0]?.message?.content
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

async function checkPinecone() {
  const start = Date.now();

  if (!process.env.PINECONE_API_KEY) {
    return {
      provider: 'Pinecone',
      status: 'ERROR',
      latency: 0,
      error: 'MISSING_API_KEY'
    };
  }

  try {
    const response = await fetch('https://api.pinecone.io/indexes', {
      method: 'GET',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'X-Pinecone-API-Version': '2024-07'
      }
    });

    const latency = Date.now() - start;
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        provider: 'Pinecone',
        status: 'ERROR',
        latency,
        error: `HTTP_${response.status}`
      };
    }

    return {
      provider: 'Pinecone',
      status: 'OK',
      latency,
      content: `${data?.indexes?.length || 0} indexes`
    };

  } catch (error) {
    return {
      provider: 'Pinecone',
      status: 'ERROR',
      latency: Date.now() - start,
      error: 'NETWORK_ERROR'
    };
  }
}

const results = await Promise.all([
  ...providers.map(checkProvider),
  checkPinecone()
]);

displayResult(results);


function displayResult(results) {
  console.log('\n🔍 Vérification des connexions API...\n');

  let success = 0;

  for (const r of results) {
    const ok = r.status === 'OK';

    if (ok) success++;

    console.log(
      ` ${r.provider.padEnd(15)} ${r.latency}ms`
    );

    if (r.content) {
  console.log(`→ ${r.content}`);
}
  }

  console.log(`\n${success}/${results.length} connexions actives\n`);

  if (success === results.length) {
    console.log('Tout est vert. Vous êtes prêts pour la suite !');
  } else {
    console.log('Certaines connexions sont en erreur.');
  }

  
}