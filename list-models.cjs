require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAe9WbUC4TEKgM6xxFBt2RgY7WMB3WrsgI"; // fallback to user provided key if env fails

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("=== Modelos Disponibles ===");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("Error listando modelos:", data);
    }
  } catch(e) {
    console.error(e);
  }
}

listModels();
