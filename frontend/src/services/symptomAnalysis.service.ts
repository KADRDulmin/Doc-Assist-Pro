import { API_URL } from "./api/base-api.service";
import geminiService from "./gemini.service";

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyCEibIAu1vBrMGXLlo4l-b-ylWSoTyI2E8';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export interface SymptomAnalysisResult {
  possibleIllness1: string;
  possibleIllness2: string;
  recommendedDoctorSpeciality1: string;
  recommendedDoctorSpeciality2: string;
  criticality: 'Low' | 'Medium' | 'High' | 'Emergency';
  explanation: string;
}

class SymptomAnalysisService {
  /**
   * Analyze patient symptoms using Gemini API
   * @param symptoms - Detailed description of patient symptoms
   * @returns Analysis result with possible illnesses, recommended doctor specialties, and criticality
   */
  async analyzeSymptoms(symptoms: string): Promise<{ success: boolean; data?: SymptomAnalysisResult; message?: string }> {
    try {
      if (!symptoms || symptoms.trim().length < 10) {
        throw new Error('Please provide a more detailed description of your symptoms');
      }

      // Construct prompt for Gemini API
      const prompt = `As a medical AI assistant, analyze the following patient symptoms and provide a structured assessment.
      
Patient symptoms: "${symptoms}"

Based on these symptoms, please provide:
1. Two most likely possible illnesses or conditions
2. Two most appropriate medical specialties that should be consulted
3. An assessment of the criticality level (must be exactly one of these: Low, Medium, High, or Emergency)
4. A brief explanation of your assessment

Format your response as a valid JSON object with the following structure:
{
  "possibleIllness1": "First possible illness/condition",
  "possibleIllness2": "Second possible illness/condition",
  "recommendedDoctorSpeciality1": "First recommended medical specialty",
  "recommendedDoctorSpeciality2": "Second recommended medical specialty",
  "criticality": "Low/Medium/High/Emergency",
  "explanation": "Brief explanation of your assessment"
}

IMPORTANT:
- Return ONLY the valid JSON object without any additional text
- Ensure all fields are completed
- For criticality, use ONLY one of: Low, Medium, High, Emergency
- If emergency is suspected, clearly indicate that immediate medical attention may be required in the explanation
- Be precise with medical specialties (e.g., "Cardiology" not "Heart Specialist")`;

      // Call Gemini API directly with updated model
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2, // Lower temperature for more deterministic results
            maxOutputTokens: 1024
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Symptom analysis API error:', errorText);
        throw new Error(`Failed to analyze symptoms: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the text from the Gemini response
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!contentText) {
        throw new Error('Invalid or empty response format from Gemini API');
      }
      
      // Parse the JSON from the response
      let analysisResult: SymptomAnalysisResult;
      try {
        // Clean the response to ensure valid JSON
        const jsonText = contentText.trim()
          .replace(/^```json/, '')  // Remove markdown code block start if present
          .replace(/```$/, '')      // Remove markdown code block end if present
          .trim();
          
        analysisResult = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Raw response:', contentText);
        throw new Error('Failed to parse symptom analysis result');
      }

      // Validate the required fields
      const requiredFields = [
        'possibleIllness1', 
        'possibleIllness2', 
        'recommendedDoctorSpeciality1', 
        'recommendedDoctorSpeciality2', 
        'criticality', 
        'explanation'
      ];
      
      for (const field of requiredFields) {
        if (!analysisResult[field as keyof SymptomAnalysisResult]) {
          throw new Error(`Missing required field in analysis response: ${field}`);
        }
      }
      
      // Validate criticality is one of the expected values
      const validCriticality = ['Low', 'Medium', 'High', 'Emergency'];
      if (!validCriticality.includes(analysisResult.criticality)) {
        // Default to Medium if invalid value received
        console.warn(`Invalid criticality value received: ${analysisResult.criticality}. Defaulting to Medium.`);
        analysisResult.criticality = 'Medium';
      }
      
      return {
        success: true,
        data: analysisResult
      };
    } catch (error) {
      console.error('Error in symptom analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze symptoms due to an unknown error';
      return {
        success: false,
        message: errorMessage
      };
    }
  }
}

export default new SymptomAnalysisService();