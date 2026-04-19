import 'dotenv/config';

const provider = {
  name: 'Mistral',
  url: 'https://api.mistral.ai/v1/chat/completions',
  key: process.env.MISTRAL_API_KEY,
  model: 'mistral-small-latest'
};

const PROMPTS = [
  "Explique le machine learning",
  "Explique-moi le machine learning",
  "Peux-tu m'expliquer le machine learning ?",
  "C'est quoi le machine learning ?",
  "Machine learning : définition et explication"
];


async function callProvider(prompt) {
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
        max_tokens: 200
      })
    });

     const latency = Date.now() - start;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content || "";

    return {
      prompt,
      content,
      tokens: data.usage?.total_tokens || 0,
      length: content.length,
      latency
    };

  } catch (error) {
    return {
      prompt,
      content: null,
      error: error.message,
      tokens: 0,
      length: 0,
      latency: 0
    };
  }
}

const results = await Promise.all(
  PROMPTS.map(callProvider)
);

console.log('\n Sensibilité du prompt (Mistral, temperature 0.3)\n');

console.log('| Formulation | Tokens | Longueur | Première phrase |');
console.log('|-------------|--------|----------|------------------|');

for (const r of results) {
  if (r.error) {
    console.log(`| ${r.prompt} | ❌ | ❌ | ${r.error} |`);
    continue;
  }

  const firstSentence = r.content.split('. ')[0] + '.';

  console.log(
    `| ${r.prompt} | ${r.tokens} | ${r.length} | ${firstSentence} |`
  );
}