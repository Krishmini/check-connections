import { generateDashboard } from './dashboard.js';

const data = {
  connections: [
    { provider: 'Mistral', status: 'OK', latency: 478 },
    { provider: 'Groq', status: 'OK', latency: 224 },
    { provider: 'HuggingFace', status: 'OK', latency: 401 },
    { provider: 'Pinecone', status: 'OK', latency: 812 }
  ],


  stress: [
    { provider: 'Mistral', success: 9, failed: 1, avgLatency: 426, p95: 485 },
    { provider: 'Groq', success: 10, failed: 0, avgLatency: 166, p95: 191 },
    { provider: 'HuggingFace', success: 10, failed: 0, avgLatency: 358, p95: 471 }
  ],


  sensitivity: [
    { prompt: 'Explique le machine learning', tokens: 220, length: 815 },
    { prompt: 'Explique-moi le machine learning', tokens: 0, length: 0 }, // erreur
    { prompt: 'Peux-tu m’expliquer le ML ?', tokens: 225, length: 880 },
    { prompt: "C'est quoi le ML ?", tokens: 222, length: 809 },
    { prompt: 'ML : définition et explication', tokens: 221, length: 931 }
  ],

  
  multilang: [
    { lang: 'Français', inputTokens: 0, outputTokens: 0, cost: 0 },
    { lang: 'English', inputTokens: 24, outputTokens: 46, cost: 0.000014 },
    { lang: 'Español', inputTokens: 25, outputTokens: 63, cost: 0.0000176 }
  ]
};

generateDashboard(data);