const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envData = fs.readFileSync(envPath, 'utf8');

const apiKeyMatch = envData.match(/GEMINI_API_KEY\s*=\s*(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey || apiKey === 'KWEFK') {
  console.error("No valid API key found in .env. Found:", apiKey);
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Also try v1
    const urlV1 = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const responseV1 = await fetch(urlV1);
    const dataV1 = await responseV1.json();
    
    fs.writeFileSync(path.join(__dirname, 'models.json'), JSON.stringify({ v1beta: data, v1: dataV1 }, null, 2));
    console.log("Models saved to tmp/models.json");
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();


