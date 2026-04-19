import 'dotenv/config';

const TEST_PROMPT = "Les phrases de livres célèbres sont des répliques qui ont marqué la culture et la littérature. Elles sont souvent utilisées pour exprimer des idées profondes, des sentiments universels ou des réflexions sur la vie.";

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

async function callProvider(provider) {
  const start = Date.now();

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.key}`
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: TEST_PROMPT }],
      max_tokens: 5,
      temperature: 0
    })
  });

  const latency = Date.now() - start;

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return latency;
}


async function stressTest(provider, n = 10) {
  const tasks = Array.from({ length: n }, () => callProvider(provider));

  const results = await Promise.allSettled(tasks);

  let success = 0;
  let failed = 0;
  let latencies = [];
  let errors = [];

  for (const r of results) {
    if (r.status === 'fulfilled') {
      success++;
      latencies.push(r.value);
    } else {
      failed++;
      errors.push(r.reason.message);
    }
  }

  const avgLatency =
    latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);

    latencies.sort((a, b) => a - b);
  const p95 =
    latencies[Math.floor(latencies.length * 0.95)] || 0;

  return {
    provider: provider.name,
    success,
    failed,
    avgLatency: Math.round(avgLatency),
    p95,
    errors
  };
}


const N = 10;

console.log(`\n Stress test : ${N} requêtes parallèles\n`);

for (const provider of providers) {
  const result = await stressTest(provider, N);


  console.log(
    `${provider.name.padEnd(12)} : ${result.success}/${N}`
  );

  console.log(
    `  avg ${result.avgLatency}ms  p95 ${result.p95}ms`
  );

  if (result.errors.length) {
    const uniqueErrors = [...new Set(result.errors)];
    console.log(`  erreurs: ${uniqueErrors.join(', ')}`);
  }

  console.log('');
}