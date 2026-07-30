import { getFirestore } from '../config/firebase.js';

export default async function hospitalRoutes(fastify, options) {
  const db = getFirestore();

  fastify.get('/', async (request, reply) => {
    try {
      const { province, city, page = 1, limit = 20 } = request.query;
      
      let query = db.collection('hospitals').where('status', '==', 'verified');

      if (province) {
        query = query.where('province', '==', province);
      }
      if (city) {
        query = query.where('city', '==', city);
      }

      const snapshot = await query.limit(parseInt(limit)).get();
      const hospitals = [];

      snapshot.forEach(doc => {
        hospitals.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: hospitals,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const hospitalDoc = await db.collection('hospitals').doc(id).get();

      if (!hospitalDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Hospital not found', statusCode: 404 },
        });
      }

      return reply.send({
        success: true,
        data: { id: hospitalDoc.id, ...hospitalDoc.data() },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
