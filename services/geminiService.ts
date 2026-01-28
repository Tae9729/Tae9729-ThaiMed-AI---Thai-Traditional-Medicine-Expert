
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, SymptomRecord, WeatherData, DiagnosisResult, Language } from "../types";
import { getAgeGroup, getKalaFactor } from "../utils/ttmCalculators";

export async function analyzeSymptoms(
  profile: UserProfile,
  record: SymptomRecord,
  weather: WeatherData,
  lang: Language = 'th'
): Promise<DiagnosisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const ageGroup = getAgeGroup(profile.birthDate);
  const kala = getKalaFactor(record.onset);

  const prompt = `
    Analyze this patient case using Thai Traditional Medicine (TTM) principles "Samutthan 4". 
    PLEASE PROVIDE THE RESPONSE IN ${lang === 'th' ? 'THAI' : 'ENGLISH'}.
    
    1. Thatu Samutthan (Elemental Cause):
       - Birth Element (Chao Ruean): ${profile.elementChaoRuean}
       - Current Symptoms: ${record.symptoms.join(', ')}
       - Extra Notes: ${record.customNotes}
    
    2. Utu Samutthan (Seasonal/Weather Cause):
       - Season: ${weather.season}
       - Current Temp: ${weather.temp}°C
       - Condition: ${weather.condition}
    
    3. Ayu Samutthan (Age Cause):
       - Age Group: ${ageGroup}
    
    4. Kala Samutthan (Time Cause):
       - Onset/Current Time: ${record.onset || 'Current time'}
       - Time Factor: ${kala}

    Use the "Decision Tree" logic from TTM scriptures like Vejjasueksa to determine which Dosha (Pitta, Wata, Semha) is currently imbalanced (aggravated, weakened, or damaged).
    Provide a professional diagnosis and holistic self-care recommendations.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A concise TTM diagnosis summary." },
          imbalance: { type: Type.STRING, enum: ["Pitta", "Wata", "Semha", "Mixed"] },
          logic: { type: Type.STRING, description: "Detailed logic based on Samutthan 4 factors." },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              food: { type: Type.ARRAY, items: { type: Type.STRING } },
              lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
              herbs: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["food", "lifestyle", "herbs"]
          }
        },
        required: ["summary", "imbalance", "logic", "recommendations"]
      },
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });

  return JSON.parse(response.text);
}
