import { getFirestore } from '../config/firebase.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export default async function doctorRoutes(fastify, options) {
  const db = getFirestore();

  // Get all doctors with filters
  fastify.get('/', async (request, reply) => {
    try {
      const { specialty, province, city, page = 1, limit = 20 } = request.query;
      
      let query = db.collection('doctors').where('status', '==', 'verified');

      if (specialty) {
        query = query.where('specialty', '==', specialty);
      }
      if (province) {
        query = query.where('province', '==', province);
      }
      if (city) {
        query = query.where('city', '==', city);
      }

      const snapshot = await query.limit(parseInt(limit)).get();
      const doctors = [];

      snapshot.forEach(doc => {
        doctors.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: doctors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: doctors.length,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get doctor by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const doctorDoc = await db.collection('doctors').doc(id).get();

      if (!doctorDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Doctor not found', statusCode: 404 },
        });
      }

      // Get reviews
      const reviewsSnapshot = await db.collection('reviews')
        .where('doctorId', '==', id)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const reviews = [];
      reviewsSnapshot.forEach(doc => {
        reviews.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: {
          ...doctorDoc.data(),
          id: doctorDoc.id,
          reviews,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get doctor availability
  fastify.get('/:id/availability', async (request, reply) => {
    try {
      const { id } = request.params;
      const { date } = request.query;

      if (!date) {
        return reply.status(400).send({
          error: { message: 'Date parameter is required', statusCode: 400 },
        });
      }

      const availabilityDoc = await db.collection('doctors')
        .doc(id)
        .collection('availability')
        .doc(date)
        .get();

      if (!availabilityDoc.exists) {
        return reply.send({
          success: true,
          data: { slots: [] },
        });
      }

      return reply.send({
        success: true,
        data: availabilityDoc.data(),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Create/Update doctor profile (for doctors only)
  fastify.post('/profile', { preHandler: [authenticate, authorize('doctor')] }, async (request, reply) => {
    try {
      const doctorData = {
        ...request.body,
        userId: request.user.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await db.collection('doctors').add(doctorData);

      return reply.status(201).send({
        success: true,
        message: 'Doctor profile created successfully',
        data: { id: docRef.id },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Update doctor availability
  fastify.put('/:id/availability', { preHandler: [authenticate, authorize('doctor')] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { date, slots } = request.body;

      if (!date || !slots) {
        return reply.status(400).send({
          error: { message: 'Date and slots are required', statusCode: 400 },
        });
      }

      await db.collection('doctors')
        .doc(id)
        .collection('availability')
        .doc(date)
        .set({
          date,
          slots,
          updatedAt: new Date().toISOString(),
        }, { merge: true });

      return reply.send({
        success: true,
        message: 'Availability updated successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get specialties list
  fastify.get('/meta/specialties', async (request, reply) => {
    try {
      const specialties = [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Pediatrician',
        'Gynecologist',
        'Orthopedic',
        'Neurologist',
        'Psychiatrist',
        'Dentist',
        'ENT Specialist',
        'Ophthalmologist',
        'Urologist',
      ];

      return reply.send({
        success: true,
        data: specialties,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
