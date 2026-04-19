import 'dotenv/config';

const provider = {
  name: 'Mistral',
  url: 'https://api.mistral.ai/v1/chat/completions',
  key: process.env.MISTRAL_API_KEY,
  model: 'mistral-small-latest'
};

const PROMPTS = [
  { lang: 'Français', text: "Explique le machine learning en 2 phrases." },
  { lang: 'English', text: "Explain machine learning in 2 sentences." },
  { lang: 'Español', text: "Explica el machine learning en 2 frases." }
];

const PRICE_PER_MILLION = 0.20;

function estimateCost(tokens) {
  return (tokens / 1_000_000) * PRICE_PER_MILLION;
}

async function callProvider(p) {
  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: 'user', content: p.text }],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      lang: p.lang,
      inputTokens,
      outputTokens,
      totalTokens,
      cost: estimateCost(totalTokens),
      content: data.choices?.[0]?.message?.content || ""
    };

  } catch (error) {
    return {
      lang: p.lang,
      error: error.message
    };
  }
}

const results = await Promise.all(
  PROMPTS.map(callProvider)
);

console.log('\n Multi-langue (Mistral, même question)\n');

console.log('| Langue   | Tokens input | Tokens output | Coût estimé (€) | Qualité (1-5) |');
console.log('|----------|-------------|---------------|------------------|----------------|');

for (const r of results) {
  if (r.error) {
    console.log(`| ${r.lang} | ❌ | ❌ | ❌ | ❌ |`);
    continue;
  }

  console.log(
    `| ${r.lang.padEnd(8)} | ${r.inputTokens.toString().padEnd(11)} | ${r.outputTokens.toString().padEnd(13)} | ${r.cost.toFixed(8)}€ | - |`
  );
}

const fr = results.find(r => r.lang === 'Français');
const en = results.find(r => r.lang === 'English');

if (fr && en && fr.inputTokens && en.inputTokens) {
  const diff = ((fr.inputTokens - en.inputTokens) / en.inputTokens) * 100;

  console.log(`\n FR consomme ${diff.toFixed(1)}% de tokens en plus que EN`);
}