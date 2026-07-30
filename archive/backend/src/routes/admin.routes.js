import { getFirestore } from '../config/firebase.js';
import { verifyToken } from '../middleware/auth.middleware.js';

export default async function adminRoutes(fastify, options) {
  const db = getFirestore();

  // Get all users (admin only)
  fastify.get('/users', { preHandler: verifyToken }, async (request, reply) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = [];
      snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
      return reply.send({ success: true, data: users });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: error.message, statusCode: 500 } });
    }
  });

  // Get user statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const [users, doctors, bookings, hospitals, labs, pharmacies] = await Promise.all([
        db.collection('users').get(),
        db.collection('doctors').get(),
        db.collection('appointments').get(),
        db.collection('hospitals').get(),
        db.collection('labs').get(),
        db.collection('pharmacies').get(),
      ]);

      const patients = [];
      users.forEach(doc => {
        const data = doc.data();
        if (data.role === 'patient') patients.push(doc.id);
      });

      return reply.send({
        success: true,
        data: {
          patients: patients.length,
          doctors: doctors.size,
          bookings: bookings.size,
          hospitals: hospitals.size,
          labs: labs.size,
          pharmacies: pharmacies.size,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: error.message, statusCode: 500 } });
    }
  });
}
