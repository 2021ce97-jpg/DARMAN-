import { getFirestore, getAuth } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { writeAuditLog } from '../services/audit_service.js';

export default async function authRoutes(fastify, options) {
  const db = getFirestore();

  // Register new user
  fastify.post('/register', async (request, reply) => {
    try {
      const { email, password, fullName, phone, role = 'patient' } = request.body;

      if (!email || !password || !fullName || !phone) {
        return reply.status(400).send({
          error: { message: 'Missing required fields', statusCode: 400 },
        });
      }

      // Create Firebase Auth user
      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: fullName,
        phoneNumber: phone,
      });

      // Set custom claims for role
      await getAuth().setCustomUserClaims(userRecord.uid, { role });

      // Create user document in Firestore
      const userData = {
        uid: userRecord.uid,
        email,
        fullName,
        phone,
        role,
        status: role === 'patient' ? 'active' : 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection('users').doc(userRecord.uid).set(userData);

      await writeAuditLog({
        actorId: userRecord.uid,
        actorRole: role,
        action: 'auth.register',
        entityType: 'user',
        entityId: userRecord.uid,
        metadata: { email, role },
        request,
      });

      return reply.status(201).send({
        success: true,
        message: 'User registered successfully',
        data: {
          uid: userRecord.uid,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Get current user profile
  fastify.get('/profile', { preHandler: authenticate }, async (request, reply) => {
    try {
      const userDoc = await db.collection('users').doc(request.user.uid).get();

      if (!userDoc.exists) {
        return reply.status(404).send({
          error: { message: 'User not found', statusCode: 404 },
        });
      }

      return reply.send({
        success: true,
        data: userDoc.data(),
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Update user profile
  fastify.put('/profile', { preHandler: authenticate }, async (request, reply) => {
    try {
      const updates = request.body;
      const allowedFields = ['fullName', 'phone', 'dateOfBirth', 'gender', 'address', 'city', 'province'];
      
      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      filteredUpdates.updatedAt = new Date().toISOString();

      await db.collection('users').doc(request.user.uid).update(filteredUpdates);

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Verify token
  fastify.post('/verify-token', async (request, reply) => {
    try {
      const { token } = request.body;

      if (!token) {
        return reply.status(400).send({
          error: { message: 'Token is required', statusCode: 400 },
        });
      }

      const decodedToken = await getAuth().verifyIdToken(token);

      return reply.send({
        success: true,
        data: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: decodedToken.role || 'patient',
        },
      });
    } catch (error) {
      return reply.status(401).send({
        error: { message: 'Invalid token', statusCode: 401 },
      });
    }
  });
}
