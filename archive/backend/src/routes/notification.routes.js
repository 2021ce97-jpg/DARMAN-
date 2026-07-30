import { getFirestore, getMessaging } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.middleware.js';

export default async function notificationRoutes(fastify, options) {
  const db = getFirestore();

  // Get user notifications
  fastify.get('/', { preHandler: authenticate }, async (request, reply) => {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', request.user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      return reply.send({
        success: true,
        data: notifications,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Mark notification as read
  fastify.put('/:id/read', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params;

      await db.collection('notifications').doc(id).update({
        read: true,
        readAt: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Mark all notifications as read
  fastify.put('/read-all', { preHandler: authenticate }, async (request, reply) => {
    try {
      const snapshot = await db.collection('notifications')
        .where('userId', '==', request.user.uid)
        .where('read', '==', false)
        .get();

      const batch = [];
      snapshot.forEach(doc => {
        batch.push(db.collection('notifications').doc(doc.id).update({
          read: true,
          readAt: new Date().toISOString(),
        }));
      });

      await Promise.all(batch);

      return reply.send({
        success: true,
        message: `${batch.length} notifications marked as read`,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Register FCM token
  fastify.post('/register-token', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { token } = request.body;

      if (!token) {
        return reply.status(400).send({
          error: { message: 'FCM token is required', statusCode: 400 },
        });
      }

      await db.collection('users').doc(request.user.uid).update({
        fcmToken: token,
        fcmTokenUpdatedAt: new Date().toISOString(),
      });

      return reply.send({
        success: true,
        message: 'FCM token registered successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Send push notification (admin/system use)
  fastify.post('/send', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { userId, title, body, type, data } = request.body;

      if (!userId || !title || !body) {
        return reply.status(400).send({
          error: { message: 'userId, title, and body are required', statusCode: 400 },
        });
      }

      // Save notification to Firestore
      const notificationData = {
        userId,
        title,
        message: body,
        type: type || 'general',
        data: data || {},
        read: false,
        createdAt: new Date().toISOString(),
      };

      const notifRef = await db.collection('notifications').add(notificationData);

      // Send FCM push notification if messaging is available
      const messaging = getMessaging();
      if (messaging) {
        try {
          // Get user's FCM token
          const userDoc = await db.collection('users').doc(userId).get();
          const fcmToken = userDoc.exists ? userDoc.data().fcmToken : null;

          if (fcmToken) {
            await messaging.send({
              token: fcmToken,
              notification: { title, body },
              data: { type: type || 'general', notificationId: notifRef.id },
            });
          }
        } catch (fcmError) {
          fastify.log.warn('FCM send failed:', fcmError.message);
        }
      }

      return reply.status(201).send({
        success: true,
        message: 'Notification sent',
        data: { id: notifRef.id },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
