import { getFirestore } from '../config/firebase.js';

export default async function labRoutes(fastify, options) {
  const db = getFirestore();

  fastify.get('/', async (request, reply) => {
    try {
      const { province, city } = request.query;
      
      let query = db.collection('labs').where('status', '==', 'verified');

      if (province) {
        query = query.where('province', '==', province);
      }
      if (city) {
        query = query.where('city', '==', city);
      }

      const snapshot = await query.get();
      const labs = [];

      snapshot.forEach(doc => {
        labs.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: labs,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
