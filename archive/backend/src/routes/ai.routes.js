import { authenticate } from '../middleware/auth.middleware.js';
import aiService from '../services/ai_service.js';

export default async function aiRoutes(fastify, options) {
  // AI Chatbot endpoint
  fastify.post('/chat', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { message, conversationHistory } = request.body;

      if (!message) {
        return reply.status(400).send({
          error: { message: 'Message is required', statusCode: 400 },
        });
      }

      const result = await aiService.chat(message, conversationHistory || []);

      if (result.success) {
        return reply.send({
          success: true,
          data: {
            response: result.response,
            conversationId: result.conversationId,
            timestamp: new Date().toISOString(),
            mockMode: result.mockMode || false,
          },
        });
      }

      return reply.status(500).send({
        error: { message: result.error || 'AI service error', statusCode: 500 },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Symptom checker
  fastify.post('/symptom-checker', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { symptoms, patientInfo } = request.body;

      if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return reply.status(400).send({
          error: { message: 'Symptoms array is required', statusCode: 400 },
        });
      }

      const result = await aiService.checkSymptoms(symptoms, patientInfo || {});

      if (result.success) {
        return reply.send({
          success: true,
          data: result.analysis,
          mockMode: result.mockMode || false,
        });
      }

      return reply.status(500).send({
        error: { message: result.error || 'Symptom checker error', statusCode: 500 },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Health advice
  fastify.post('/health-advice', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { topic } = request.body;

      if (!topic) {
        return reply.status(400).send({
          error: { message: 'Topic is required', statusCode: 400 },
        });
      }

      const result = await aiService.getHealthAdvice(topic);

      if (result.success) {
        return reply.send({
          success: true,
          data: {
            advice: result.advice,
            topic: result.topic,
          },
          mockMode: result.mockMode || false,
        });
      }

      return reply.status(500).send({
        error: { message: result.error || 'Health advice error', statusCode: 500 },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
