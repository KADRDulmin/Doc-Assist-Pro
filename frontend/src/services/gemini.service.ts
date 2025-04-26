import { API_URL } from "./api/base-api.service";
import { BaseApiService, HttpMethod } from "./api/base-api.service";

// Gemini API key - IMPORTANT: Avoid hardcoding keys directly in source code for production. Consider environment variables.
const GEMINI_API_KEY = 'AIzaSyCEibIAu1vBrMGXLlo4l-b-ylWSoTyI2E8'; 
// Use a valid and recent model, like gemini-1.5-flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export interface HealthTipRecommendation {
  id: string;
  title: string;
  summary: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface HealthTipContent {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  created_at: string;
}

class GeminiService extends BaseApiService {
  /**
   * Generate personalized health tips based on patient appointments and medical info
   * @param doctorSpecialties - Array of doctor specialties from the patient's appointments
   * @param medicalConditions - Optional patient medical conditions
   * @returns Array of health tip recommendations
   */
  async getPersonalizedHealthTips(
    doctorSpecialties: string[] = [],
    medicalConditions: string = ''
  ): Promise<{ success: boolean; data?: HealthTipRecommendation[]; message?: string }> {
    try {
      // Fallback to general health tips if no specialties are provided
      const specialties = doctorSpecialties.length > 0 
        ? doctorSpecialties.join(', ') 
        : 'general health';
      
      // Construct the prompt for Gemini - Explicitly ask for ONLY the JSON array string
      const prompt = `Generate exactly 3 health tips related to the following medical specialties: ${specialties}. 
      ${medicalConditions ? `Consider that the patient has these medical conditions: ${medicalConditions}.` : ''}
      
      Format each tip as a JSON object with these exact keys: 
      - "title" (string, short and engaging)
      - "summary" (string, 1-2 sentences)
      - "category" (string, the primary medical specialty it relates to)
      
      Return ONLY a valid JSON array string containing these 3 objects. Do not include any introductory text, explanation, markdown formatting (like \`\`\`json), or anything else outside the JSON array string itself. Example format: [{"title": "...", "summary": "...", "category": "..."}, ...]`;
      
      // Call Gemini API
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          // Optional: Add safety settings if needed
          // safetySettings: [ ... ], 
          // Optional: Configure generation parameters
          // generationConfig: { temperature: 0.7, maxOutputTokens: 500 } 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the correct Gemini response structure
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        console.error('Invalid response structure from Gemini API:', JSON.stringify(data, null, 2));
        throw new Error('Invalid or empty response format from Gemini API');
      }
      
      // Attempt to parse the JSON string
      let healthTips: Omit<HealthTipRecommendation, 'id' | 'created_at' | 'updated_at'>[];
      try {
        // Trim whitespace which might interfere with parsing
        healthTips = JSON.parse(contentText.trim()); 
      } catch (parseError) {
        console.error('Failed to parse JSON response from Gemini:', parseError);
        console.error('Received text:', contentText);
        throw new Error('Failed to parse health tips data from Gemini API.');
      }

      // Validate if it's an array
      if (!Array.isArray(healthTips)) {
        console.error('Parsed data is not an array:', healthTips);
        throw new Error('Expected an array of health tips from Gemini API.');
      }
      
      // Add timestamps and IDs
      const now = new Date().toISOString();
      const tipsWithIds = healthTips.map((tip, index) => ({
        ...tip,
        id: `gemini-${Date.now()}-${index}`,
        created_at: now,
        updated_at: now
      }));
      
      return {
        success: true,
        data: tipsWithIds
      };
    } catch (error) {
      console.error('Error in getPersonalizedHealthTips:', error);
      // Log the specific error that occurred
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate health tips due to an unknown error';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Generate detailed content for a health tip
   * @param title - The title of the health tip
   * @param category - The medical specialty category
   * @returns Detailed health tip content
   */
  async generateHealthTipContent(
    title: string,
    category: string
  ): Promise<{ success: boolean; data?: HealthTipContent; message?: string }> {
    try {
      // Construct the prompt for Gemini - Ask for ONLY the article text
      const prompt = `Generate a detailed but concise article (around 300-400 words) about "${title}" related to the medical field of ${category}. 
      The article should be informative, accurate, easy for a patient to understand, and include practical advice.
      
      Return ONLY the article text. Do not include a title within the text, markdown formatting, or any other surrounding text.`;
      
      // Call Gemini API
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
           // Optional: Configure generation parameters
          // generationConfig: { temperature: 0.7, maxOutputTokens: 800 } 
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the correct Gemini response structure
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        console.error('Invalid response structure from Gemini API:', JSON.stringify(data, null, 2));
        throw new Error('Invalid or empty response format from Gemini API');
      }
      
      // Create the health tip content object
      const healthTipContent: HealthTipContent = {
        id: `content-${Date.now()}`,
        title,
        content: contentText.trim(), // Trim whitespace
        category,
        source: 'Generated with Google Gemini AI',
        created_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: healthTipContent
      };
    } catch (error) {
      console.error('Error in generateHealthTipContent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate health tip content due to an unknown error';
      return {
        success: false,
        message: errorMessage
      };
    }
  }
}

export default new GeminiService();