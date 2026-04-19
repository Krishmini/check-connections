import 'dotenv/config';


function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}


const PRICING = {
  "Mistral Small": 0.20,
  "Groq Llama 3": 0.05,
  "GPT-4o": 2.50
};


function estimateCost(text, modelName) {
  const tokens = estimateTokens(text);

  const costPerMillion = PRICING[modelName] || 0;

  const cost = (tokens / 1_000_000) * costPerMillion;

  return {
    tokens,
    cost
  };
}


function displayCost(text) {
  console.log(`\nTexte : ${text.length} caractères → ~${estimateTokens(text)} tokens\n`);

  console.log("Provider           | Coût estimé (input)");
  console.log("----------------------------------------");

  for (const model of Object.keys(PRICING)) {
    const { cost } = estimateCost(text, model);

    console.log(
      `${model.padEnd(18)} | ${cost.toFixed(8)}€`
    );
  }

  console.log("----------------------------------------\n");

  console.log("Coût pour 1000 requêtes :");

  for (const model of Object.keys(PRICING)) {
    const { cost } = estimateCost(text, model);

    console.log(
      `${model.padEnd(18)} | ${(cost * 1000).toFixed(5)}€`
    );
  }
}

const text =
  "Les phrases de livres célèbres sont des répliques qui ont marqué la culture et la littérature. Elles sont souvent utilisées pour exprimer des idées profondes, des sentiments universels ou des réflexions sur la vie.";

displayCost(text);
