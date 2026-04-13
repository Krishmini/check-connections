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