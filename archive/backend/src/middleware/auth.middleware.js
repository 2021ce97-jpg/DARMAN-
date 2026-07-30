import { getAuth } from '../config/firebase.js';

export const authenticate = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Missing or invalid authorization header',
          statusCode: 401,
        },
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      request.user = decodedToken;
    } catch (error) {
      return reply.status(401).send({
        error: {
          message: 'Invalid or expired token',
          statusCode: 401,
        },
      });
    }
  } catch (error) {
    return reply.status(500).send({
      error: {
        message: 'Authentication error',
        statusCode: 500,
      },
    });
  }
};

export const authorize = (...roles) => {
  return async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: {
          message: 'Unauthorized',
          statusCode: 401,
        },
      });
    }

    const userRole = request.user.role || 'patient';
    
    if (!roles.includes(userRole)) {
      return reply.status(403).send({
        error: {
          message: 'Forbidden: Insufficient permissions',
          statusCode: 403,
        },
      });
    }
  };
};
