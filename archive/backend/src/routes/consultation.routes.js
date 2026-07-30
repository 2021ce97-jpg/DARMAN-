import { getFirestore } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.middleware.js';
import videoService from '../services/video_service.js';

const APPOINTMENTS_COLLECTION = 'appointments';

export default async function consultationRoutes(fastify, options) {
  const db = getFirestore();

  // Get consultation by booking ID
  fastify.get('/:bookingId', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { bookingId } = request.params;
      
      const consultationDoc = await db.collection('consultations').doc(bookingId).get();

      if (!consultationDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Consultation not found', statusCode: 404 },
        });
      }

      return reply.send({
        success: true,
        data: { id: consultationDoc.id, ...consultationDoc.data() },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Start video consultation
  fastify.post('/:bookingId/start', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { bookingId } = request.params;
      
      // Get booking details
      const bookingDoc = await db.collection(APPOINTMENTS_COLLECTION).doc(bookingId).get();

      if (!bookingDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Booking not found', statusCode: 404 },
        });
      }

      const bookingData = bookingDoc.data();

      // Verify user is part of this consultation
      if (bookingData.patientId !== request.user.uid && bookingData.doctorId !== request.user.uid) {
        return reply.status(403).send({
          error: { message: 'Access denied', statusCode: 403 },
        });
      }

      // Start video consultation
      const videoResult = await videoService.startConsultation(
        bookingId,
        bookingData.doctorId,
        bookingData.patientId
      );

      if (!videoResult.success) {
        return reply.status(500).send({
          error: { message: videoResult.error || 'Failed to start consultation', statusCode: 500 },
        });
      }

      // Save consultation to database
      await db.collection('consultations').doc(bookingId).set({
        bookingId,
        doctorId: bookingData.doctorId,
        patientId: bookingData.patientId,
        channelName: videoResult.consultation.channelName,
        status: 'active',
        startedAt: videoResult.consultation.startedAt,
        createdAt: new Date().toISOString(),
      });

      // Update booking status
      await db.collection(APPOINTMENTS_COLLECTION).doc(bookingId).update({
        status: 'in-consultation',
        consultationStartedAt: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        data: videoResult.consultation,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // End video consultation
  fastify.post('/:bookingId/end', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { bookingId } = request.params;
      const { duration, notes } = request.body;

      const consultationDoc = await db.collection('consultations').doc(bookingId).get();

      if (!consultationDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Consultation not found', statusCode: 404 },
        });
      }

      const consultationData = consultationDoc.data();

      // End video call
      const endResult = await videoService.endConsultation(consultationData.channelName);

      // Update consultation
      await db.collection('consultations').doc(bookingId).update({
        status: 'completed',
        endedAt: new Date().toISOString(),
        duration: duration || endResult.duration,
        notes: notes || '',
      });

      // Update booking
      await db.collection(APPOINTMENTS_COLLECTION).doc(bookingId).update({
        status: 'completed',
        consultationEndedAt: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        message: 'Consultation ended successfully',
        data: {
          endedAt: endResult.endedAt,
          duration: duration || endResult.duration,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get video token (for reconnection)
  fastify.post('/:bookingId/token', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { bookingId } = request.params;

      const consultationDoc = await db.collection('consultations').doc(bookingId).get();

      if (!consultationDoc.exists) {
        return reply.status(404).send({
          error: { message: 'Consultation not found', statusCode: 404 },
        });
      }

      const consultationData = consultationDoc.data();
      const userRole = consultationData.doctorId === request.user.uid ? 'doctor' : 'patient';
      const uid = `${userRole}_${request.user.uid}`;

      const tokenResult = await videoService.generateToken(
        consultationData.channelName,
        uid,
        'publisher'
      );

      if (!tokenResult.success) {
        return reply.status(500).send({
          error: { message: 'Failed to generate token', statusCode: 500 },
        });
      }

      return reply.send({
        success: true,
        data: {
          token: tokenResult.token,
          channelName: consultationData.channelName,
          uid,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
