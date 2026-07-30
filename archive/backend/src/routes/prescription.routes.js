import { getFirestore, getStorage } from '../config/firebase.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

export default async function prescriptionRoutes(fastify, options) {
  const db = getFirestore();

  // Create prescription (doctors only)
  fastify.post('/', { preHandler: [authenticate, authorize('doctor')] }, async (request, reply) => {
    try {
      const {
        patientId,
        bookingId,
        diagnosis,
        medications,
        instructions,
        followUpDate,
      } = request.body;

      if (!patientId || !medications || !Array.isArray(medications)) {
        return reply.status(400).send({
          error: { message: 'Missing required fields', statusCode: 400 },
        });
      }

      const prescriptionData = {
        patientId,
        doctorId: request.user.uid,
        bookingId: bookingId || null,
        diagnosis: diagnosis || '',
        medications,
        instructions: instructions || '',
        followUpDate: followUpDate || null,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const prescriptionRef = await db.collection('prescriptions').add(prescriptionData);

      // Create notification for patient
      await db.collection('notifications').add({
        userId: patientId,
        type: 'prescription',
        title: 'New Prescription',
        message: 'You have received a new prescription from your doctor',
        data: { prescriptionId: prescriptionRef.id },
        read: false,
        createdAt: new Date().toISOString(),
      });

      return reply.status(201).send({
        success: true,
        message: 'Prescription created successfully',
        data: { id: prescriptionRef.id, ...prescriptionData },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get patient prescriptions
  fastify.get('/my-prescriptions', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { status, page = 1, limit = 20 } = request.query;

      let query = db.collection('prescriptions')
        .where('patientId', '==', request.user.uid);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      const prescriptions = [];
      for (const doc of snapshot.docs) {
        const prescriptionData = doc.data();

        // Get doctor details
        const doctorDoc = await db.collection('doctors').doc(prescriptionData.doctorId).get();

        prescriptions.push({
          id: doc.id,
          ...prescriptionData,
          doctor: doctorDoc.exists ? doctorDoc.data() : null,
        });
      }

      return reply.send({
        success: true,
        data: prescriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: prescriptions.length,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get doctor's prescriptions
  fastify.get('/doctor-prescriptions', { preHandler: [authenticate, authorize('doctor')] }, async (request, reply) => {
    try {
      const { patientId, page = 1, limit = 20 } = request.query;

      let query = db.collection('prescriptions')
        .where('doctorId', '==', request.user.uid);

      if (patientId) {
        query = query.where('patientId', '==', patientId);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .get();

      const prescriptions = [];
      snapshot.forEach(doc => {
        prescriptions.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get prescription by ID
  fastify.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params;

      const prescriptionDoc = await db.collection('prescriptions').doc(id).get();

      if (!prescriptionDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Prescription not found', statusCode: 404 },
        });
      }

      const prescriptionData = prescriptionDoc.data();

      // Verify access
      if (
        prescriptionData.patientId !== request.user.uid &&
        prescriptionData.doctorId !== request.user.uid
      ) {
        return reply.status(403).send({
          error: { message: 'Access denied', statusCode: 403 },
        });
      }

      // Get doctor details
      const doctorDoc = await db.collection('doctors').doc(prescriptionData.doctorId).get();

      return reply.send({
        success: true,
        data: {
          id: prescriptionDoc.id,
          ...prescriptionData,
          doctor: doctorDoc.exists ? doctorDoc.data() : null,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Update prescription status
  fastify.put('/:id/status', { preHandler: [authenticate, authorize('doctor')] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { status } = request.body;

      if (!['active', 'completed', 'cancelled'].includes(status)) {
        return reply.status(400).send({
          error: { message: 'Invalid status', statusCode: 400 },
        });
      }

      await db.collection('prescriptions').doc(id).update({
        status,
        updatedAt: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        message: 'Prescription status updated',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
