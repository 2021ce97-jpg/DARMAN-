import { getFirestore } from '../config/firebase.js';

export default async function searchRoutes(fastify, options) {
  const db = getFirestore();

  // Global search
  fastify.get('/', async (request, reply) => {
    try {
      const { q, type, province, city } = request.query;

      if (!q) {
        return reply.status(400).send({
          error: { message: 'Search query is required', statusCode: 400 },
        });
      }

      const results = {
        doctors: [],
        hospitals: [],
        labs: [],
        pharmacies: [],
      };

      // Search doctors
      if (!type || type === 'doctors') {
        let doctorQuery = db.collection('doctors').where('status', '==', 'verified');
        
        if (province) {
          doctorQuery = doctorQuery.where('province', '==', province);
        }

        const doctorSnapshot = await doctorQuery.limit(10).get();
        doctorSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.fullName?.toLowerCase().includes(q.toLowerCase()) ||
              data.specialty?.toLowerCase().includes(q.toLowerCase())) {
            results.doctors.push({ id: doc.id, ...data });
          }
        });
      }

      // Search hospitals
      if (!type || type === 'hospitals') {
        const hospitalSnapshot = await db.collection('hospitals')
          .where('status', '==', 'verified')
          .limit(10)
          .get();
        
        hospitalSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name?.toLowerCase().includes(q.toLowerCase())) {
            results.hospitals.push({ id: doc.id, ...data });
          }
        });
      }

      return reply.send({
        success: true,
        data: results,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
