import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.mockMode = !this.geminiApiKey || this.geminiApiKey.includes('your-');
  }

  /**
   * Chat with AI assistant
   */
  async chat(message, conversationHistory = []) {
    if (this.mockMode) {
      return this._mockChat(message, conversationHistory);
    }

    try {
      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            ...conversationHistory.map(msg => ({
              role: msg.role,
              parts: [{ text: msg.content }],
            })),
            {
              role: 'user',
              parts: [{ text: message }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        response: aiResponse,
        conversationId: `conv_${Date.now()}`,
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Symptom checker
   */
  async checkSymptoms(symptoms, patientInfo = {}) {
    if (this.mockMode) {
      return this._mockCheckSymptoms(symptoms, patientInfo);
    }

    const prompt = `You are a medical AI assistant. Based on the following symptoms, provide:
1. Possible conditions (with probability)
2. Urgency level (low, medium, high, emergency)
3. Recommended actions
4. When to see a doctor

Patient Info:
- Age: ${patientInfo.age || 'Not provided'}
- Gender: ${patientInfo.gender || 'Not provided'}

Symptoms: ${symptoms.join(', ')}

Important: This is for informational purposes only and not a substitute for professional medical advice.`;

    try {
      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            role: 'user',
            parts: [{ text: prompt }],
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        analysis: aiResponse,
        symptoms,
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get health advice
   */
  async getHealthAdvice(topic) {
    if (this.mockMode) {
      return this._mockGetHealthAdvice(topic);
    }

    const prompt = `Provide brief, accurate health advice about: ${topic}. 
Keep it concise (2-3 paragraphs) and include:
1. Key information
2. Prevention tips
3. When to seek medical help

Use simple language suitable for general public.`;

    try {
      const response = await axios.post(
        `${this.geminiBaseUrl}/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [{
            role: 'user',
            parts: [{ text: prompt }],
          }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.candidates[0].content.parts[0].text;

      return {
        success: true,
        advice: aiResponse,
        topic,
      };
    } catch (error) {
      console.error('Gemini API error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Mock implementations
  _mockChat(message, conversationHistory) {
    console.log(`🤖 [MOCK] AI Chat: ${message}`);

    const responses = [
      "I'm here to help with your health questions. How can I assist you today?",
      "Based on your symptoms, I recommend consulting with a doctor for a proper diagnosis.",
      "It's important to maintain a healthy lifestyle with regular exercise and balanced diet.",
      "If you're experiencing severe symptoms, please seek immediate medical attention.",
      "I can help you find doctors, book appointments, or answer general health questions.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      response: randomResponse,
      conversationId: `conv_mock_${Date.now()}`,
      mockMode: true,
    };
  }

  _mockCheckSymptoms(symptoms, patientInfo) {
    console.log(`🤖 [MOCK] Symptom Check: ${symptoms.join(', ')}`);

    const conditions = [
      { name: 'Common Cold', probability: 'High', severity: 'Low' },
      { name: 'Flu', probability: 'Medium', severity: 'Medium' },
      { name: 'Allergies', probability: 'Medium', severity: 'Low' },
    ];

    const urgencyLevels = ['low', 'medium', 'high'];
    const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)];

    return {
      success: true,
      analysis: {
        possibleConditions: conditions,
        urgencyLevel: urgency,
        recommendations: [
          'Rest and stay hydrated',
          'Monitor your symptoms',
          'Consult a doctor if symptoms worsen',
          'Take over-the-counter medication if needed',
        ],
        whenToSeeDoctor: urgency === 'high' 
          ? 'Seek medical attention within 24 hours'
          : 'Consult a doctor if symptoms persist for more than 3 days',
      },
      symptoms,
      mockMode: true,
    };
  }

  _mockGetHealthAdvice(topic) {
    console.log(`🤖 [MOCK] Health Advice: ${topic}`);

    return {
      success: true,
      advice: `Here's some general advice about ${topic}:

**Key Information:**
${topic} is an important health topic that affects many people. It's essential to understand the basics and take preventive measures.

**Prevention Tips:**
- Maintain a healthy lifestyle
- Regular check-ups with your doctor
- Stay informed about your health
- Follow medical advice

**When to Seek Help:**
If you experience severe symptoms or have concerns, consult with a healthcare professional immediately.

*Note: This is general information and not a substitute for professional medical advice.*`,
      topic,
      mockMode: true,
    };
  }
}

export default new AIService();
