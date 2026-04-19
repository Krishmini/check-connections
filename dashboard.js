import fs from 'fs';

function getColor(status) {
  if (status === 'OK') return '#16a34a';
  if (status === 'ERROR') return '#dc2626';
  return '#f59e0b';
}

export function generateDashboard(data) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AI Dashboard</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    h2 { margin-top: 40px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>

<body>

<h1> Dashboard IA</h1>

<h2>Connexions API</h2>
<table>
<tr><th>Provider</th><th>Status</th><th>Latency</th></tr>
${data.connections.map(r => `
<tr>
  <td>${r.provider}</td>
  <td style="color:${getColor(r.status)}">${r.status}</td>
  <td>${r.latency} ms</td>
</tr>
`).join('')}
</table>


<h2>Stress Test</h2>
<table>
<tr><th>Provider</th><th>Succès</th><th>Avg</th><th>P95</th></tr>
${data.stress.map(r => `
<tr>
  <td>${r.provider}</td>
  <td>${r.success}/${r.success + r.failed}</td>
  <td>${r.avgLatency} ms</td>
  <td>${r.p95} ms</td>
</tr>
`).join('')}
</table>


<h2>Sensibilité du prompt</h2>
<table>
<tr><th>Prompt</th><th>Tokens</th><th>Longueur</th></tr>
${data.sensitivity.map(r => `
<tr>
  <td>${r.prompt}</td>
  <td>${r.tokens}</td>
  <td>${r.length}</td>
</tr>
`).join('')}
</table>


<h2>Multi-langue</h2>
<table>
<tr><th>Langue</th><th>Input</th><th>Output</th><th>Coût (€)</th></tr>
${data.multilang.map(r => `
<tr>
  <td>${r.lang}</td>
  <td>${r.inputTokens}</td>
  <td>${r.outputTokens}</td>
  <td>${r.cost.toFixed(8)}€</td>
</tr>
`).join('')}
</table>

</body>
</html>
`;

  fs.writeFileSync('results.html', html);
  console.log(' Dashboard généré : results.html');
}