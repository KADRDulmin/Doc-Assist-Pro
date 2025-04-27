const { GoogleGenerativeAI } = require('@google/generative-ai');
const appointmentRepository = require('../repositories/appointmentRepository');
const doctorRepository = require('../repositories/doctorRepository');
const { ValidationError } = require('../utils/errors');

// Hardcoded API key - In production, use environment variables instead
const GEMINI_API_KEY = 'AIzaSyCEibIAu1vBrMGXLlo4l-b-ylWSoTyI2E8';

/**
 * Service for handling symptom analysis using Gemini API
 */
class SymptomAnalysisService {
    constructor() {
        // Use the hardcoded API key instead of environment variable
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Use the latest model version
        this.modelName = 'gemini-1.5-flash-latest';
    }

    /**
     * Create an appointment with symptom analysis
     * @param {Object} appointmentData - Basic appointment data
     * @param {String} symptoms - Patient's symptoms description
     * @param {Object} patientInfo - Additional patient information like age, gender, medical history
     * @returns {Object} Created appointment with analysis
     */
    async createAppointmentWithSymptomAnalysis(appointmentData, symptoms, patientInfo) {
        try {
            // Step 1: Analyze symptoms using Gemini API
            const analysis = await this.analyzeSymptoms(symptoms, patientInfo);
            
            // Step 2: If no doctor_id is provided, find appropriate doctor based on analysis
            if (!appointmentData.doctor_id && analysis.recommended_doctor_speciality_1) {
                const doctors = await this.findRecommendedDoctors(analysis.recommended_doctor_speciality_1);
                if (doctors && doctors.length > 0) {
                    appointmentData.doctor_id = doctors[0].id;
                }
            }
            
            // Step 3: Combine appointment data with analysis results
            const appointmentWithAnalysis = {
                ...appointmentData,
                symptoms,
                possible_illness_1: analysis.possible_illness_1,
                possible_illness_2: analysis.possible_illness_2,
                recommended_doctor_speciality_1: analysis.recommended_doctor_speciality_1,
                recommended_doctor_speciality_2: analysis.recommended_doctor_speciality_2,
                criticality_level: analysis.criticality,
                symptom_analysis_json: JSON.stringify({
                    assessment: analysis.assessment,
                    follow_up_questions: analysis.follow_up_questions,
                    patient_info: patientInfo
                })
            };
            
            // Step 4: Create the appointment
            const createdAppointment = await appointmentRepository.createAppointment(appointmentWithAnalysis);
            
            return {
                appointment: createdAppointment,
                analysis: analysis
            };
        } catch (error) {
            console.error('Error in createAppointmentWithSymptomAnalysis:', error);
            throw error;
        }
    }

    /**
     * Update an existing appointment with symptom analysis
     * @param {String} appointmentId - Appointment ID
     * @param {String} symptoms - Patient's symptoms description
     * @param {Object} patientInfo - Additional patient information
     * @returns {Object} Updated appointment with analysis
     */
    async updateAppointmentWithSymptomAnalysis(appointmentId, symptoms, patientInfo) {
        try {
            // Step 1: Verify appointment exists
            const existingAppointment = await appointmentRepository.getAppointmentById(appointmentId);
            
            if (!existingAppointment) {
                throw new ValidationError('Appointment not found');
            }
            
            // Step 2: Analyze symptoms using Gemini API
            const analysis = await this.analyzeSymptoms(symptoms, patientInfo);
            
            // Step 3: Combine appointment data with analysis results
            const appointmentWithAnalysis = {
                symptoms,
                possible_illness_1: analysis.possible_illness_1,
                possible_illness_2: analysis.possible_illness_2,
                recommended_doctor_speciality_1: analysis.recommended_doctor_speciality_1,
                recommended_doctor_speciality_2: analysis.recommended_doctor_speciality_2,
                criticality_level: analysis.criticality,
                symptom_analysis_json: JSON.stringify({
                    assessment: analysis.assessment,
                    follow_up_questions: analysis.follow_up_questions,
                    patient_info: patientInfo
                })
            };
            
            // Step 4: Update the appointment
            const updatedAppointment = await appointmentRepository.updateAppointment(
                appointmentId,
                appointmentWithAnalysis
            );
            
            return {
                appointment: updatedAppointment,
                analysis: analysis
            };
        } catch (error) {
            console.error('Error in updateAppointmentWithSymptomAnalysis:', error);
            throw error;
        }
    }

    /**
     * Find recommended doctors based on specialty
     * @param {String} specialty - Medical specialty recommended from symptom analysis
     * @returns {Array} List of doctors with matching specialty
     */
    async findRecommendedDoctors(specialty) {
        try {
            if (!specialty) {
                throw new ValidationError('Specialty is required to find matching doctors');
            }
            
            // Case-insensitive specialty comparison
            const normalizedSpecialty = specialty.trim();
            
            // First try to find doctors using the doctor repository
            let doctors = await doctorRepository.getAllDoctors({
                specialization: normalizedSpecialty
            });
            
            // If no exact matches, try a more flexible search through appointment repository
            if (!doctors || doctors.length === 0) {
                console.log(`No exact specialty matches for "${normalizedSpecialty}", trying flexible search`);
                doctors = await appointmentRepository.getDoctorsBySpeciality(normalizedSpecialty);
            }
            
            // If still no matches, try a more generic search (partial match)
            if (!doctors || doctors.length === 0) {
                console.log(`No matches found for "${normalizedSpecialty}", getting all doctors and filtering`);
                const allDoctors = await doctorRepository.getAllDoctors();
                
                doctors = allDoctors.filter(doctor => 
                    doctor.specialization && 
                    (doctor.specialization.toLowerCase().includes(normalizedSpecialty.toLowerCase()) || 
                     normalizedSpecialty.toLowerCase().includes(doctor.specialization.toLowerCase()))
                );
            }
            
            return doctors || [];
        } catch (error) {
            console.error('Error finding recommended doctors:', error);
            return [];
        }
    }

    /**
     * Analyze symptoms using Gemini API
     * @param {String} symptoms - Patient's symptoms description
     * @param {Object} patientInfo - Additional patient information
     * @returns {Object} Analysis results
     */
    async analyzeSymptoms(symptoms, patientInfo = {}) {
        try {
            if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 10) {
                throw new ValidationError('Please provide a detailed symptom description (at least 10 characters)');
            }
            
            const model = this.genAI.getGenerativeModel({ model: this.modelName });
            
            // Format patient info for the prompt
            const patientInfoText = Object.entries(patientInfo)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
                
            // Construct the prompt with better structure for reliable JSON output
            const prompt = `
                As a medical assistant, analyze the following patient symptoms and provide medical insights:
                
                PATIENT INFORMATION:
                ${patientInfoText || 'No additional information provided'}
                
                SYMPTOMS:
                ${symptoms}
                
                INSTRUCTIONS:
                Analyze the symptoms and provide the following information in valid JSON format.
                
                Use EXACTLY these field names in your JSON:
                1. "possible_illness_1" (String): First most likely potential illness
                2. "possible_illness_2" (String): Second most likely potential illness  
                3. "recommended_doctor_speciality_1" (String): First recommended doctor specialty to consult
                4. "recommended_doctor_speciality_2" (String): Second recommended doctor specialty to consult
                5. "criticality" (String): One of: "Low", "Medium", "High", "Emergency"
                6. "assessment" (String): Brief assessment (1-2 paragraphs)
                7. "follow_up_questions" (Array of strings): 3-5 follow-up questions to ask the patient
                
                IMPORTANT: Return ONLY the properly formatted JSON object, no markdown formatting, no additional text outside the JSON.
            `;
            
            // Set generation configuration for better results
            const generationConfig = {
                temperature: 0.2,
                maxOutputTokens: 1024,
                topK: 40,
                topP: 0.95
            };
            
            // Generate response from Gemini with error handling
            console.log('Sending symptoms to Gemini for analysis...');
            const result = await model.generateContent({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig
            });
            
            const response = result.response;
            const text = response.text();
            console.log('Received response from Gemini');
            
            // Extract JSON from the response
            let jsonStr = text;
            // Clean the text in case the AI wrapped it in markdown code blocks
            jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            
            try {
                console.log('Parsing JSON response');
                const analysisResult = JSON.parse(jsonStr);
                
                // Ensure we have all the expected fields with defaults
                const sanitizedResult = {
                    possible_illness_1: analysisResult.possible_illness_1 || 'Undetermined',
                    possible_illness_2: analysisResult.possible_illness_2 || 'Undetermined',
                    recommended_doctor_speciality_1: analysisResult.recommended_doctor_speciality_1 || 'General Practice',
                    recommended_doctor_speciality_2: analysisResult.recommended_doctor_speciality_2 || 'Internal Medicine',
                    criticality: analysisResult.criticality || 'Medium',
                    assessment: analysisResult.assessment || 'Unable to provide a detailed assessment with the given information.',
                    follow_up_questions: Array.isArray(analysisResult.follow_up_questions) ? 
                        analysisResult.follow_up_questions : 
                        ['When did the symptoms first appear?', 'Have you taken any medication for these symptoms?']
                };
                
                // Validate criticality is one of the expected values
                if (!['Low', 'Medium', 'High', 'Emergency'].includes(sanitizedResult.criticality)) {
                    sanitizedResult.criticality = 'Medium';
                }
                
                console.log('Symptom analysis complete');
                return sanitizedResult;
            } catch (parseError) {
                console.error('Error parsing Gemini API response:', parseError);
                console.error('Raw response:', text);
                throw new Error('Failed to parse AI response for symptom analysis. Please try again.');
            }
        } catch (error) {
            console.error('Error during symptom analysis:', error);
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new Error('Failed to analyze symptoms with AI: ' + (error.message || 'Unknown error'));
        }
    }
}

module.exports = new SymptomAnalysisService();