import { getFirestore } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function emrRoutes(fastify, options) {
  const db = getFirestore();

  // Get patient medical records
  fastify.get('/records', { preHandler: authenticate }, async (request, reply) => {
    try {
      const snapshot = await db.collection('medical_records')
        .where('patientId', '==', request.user.uid)
        .orderBy('createdAt', 'desc')
        .get();

      const records = [];
      snapshot.forEach(doc => {
        records.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: records,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Add medical record
  fastify.post('/records', { preHandler: authenticate }, async (request, reply) => {
    try {
      const recordData = {
        ...request.body,
        patientId: request.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const recordRef = await db.collection('medical_records').add(recordData);

      return reply.status(201).send({
        success: true,
        message: 'Medical record added successfully',
        data: { id: recordRef.id },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
