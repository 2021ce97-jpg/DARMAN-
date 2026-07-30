import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase.js';
import authRoutes from './routes/auth.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import hospitalRoutes from './routes/hospital.routes.js';
import labRoutes from './routes/lab.routes.js';
import pharmacyRoutes from './routes/pharmacy.routes.js';
import emrRoutes from './routes/emr.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import searchRoutes from './routes/search.routes.js';
import aiRoutes from './routes/ai.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Initialize Firebase Admin
initializeFirebase();

// Register plugins
await fastify.register(helmet, {
  contentSecurityPolicy: false,
});

await fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://mediconnect-4b155.web.app',
        'https://mediconnect-4b155.firebaseapp.com',
        /\.onrender\.com$/,   // allow Render preview URLs
        /\.vercel\.app$/,     // allow Vercel preview URLs
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

await fastify.register(rateLimit, {
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW) || 60000,
});

// Root route - API info
fastify.get('/', async (request, reply) => {
  return {
    name: 'DARMAN Healthcare API',
    version: '1.0.0',
    status: 'running',
    description: 'Healthcare platform for Afghanistan',
    docs: '/health',
    endpoints: {
      health: '/health',
      doctors: '/api/v1/doctors',
      hospitals: '/api/v1/hospitals',
      labs: '/api/v1/labs',
      pharmacies: '/api/v1/pharmacies',
      search: '/api/v1/search',
      auth: '/api/v1/auth',
      bookings: '/api/v1/bookings',
    },
  };
});

// Health check route
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MediConnect API',
    version: '1.0.0'
  };
});

// API routes
fastify.register(authRoutes, { prefix: '/api/v1/auth' });
fastify.register(doctorRoutes, { prefix: '/api/v1/doctors' });
fastify.register(bookingRoutes, { prefix: '/api/v1/bookings' });
fastify.register(consultationRoutes, { prefix: '/api/v1/consultations' });
fastify.register(hospitalRoutes, { prefix: '/api/v1/hospitals' });
fastify.register(labRoutes, { prefix: '/api/v1/labs' });
fastify.register(pharmacyRoutes, { prefix: '/api/v1/pharmacies' });
fastify.register(emrRoutes, { prefix: '/api/v1/emr' });
fastify.register(paymentRoutes, { prefix: '/api/v1/payments' });
fastify.register(searchRoutes, { prefix: '/api/v1/search' });
fastify.register(aiRoutes, { prefix: '/api/v1/ai' });
fastify.register(notificationRoutes, { prefix: '/api/v1/notifications' });
fastify.register(prescriptionRoutes, { prefix: '/api/v1/prescriptions' });
fastify.register(uploadRoutes, { prefix: '/api/v1/upload' });
fastify.register(adminRoutes, { prefix: '/api/v1/admin' });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  reply.status(statusCode).send({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`🚀 MediConnect API server running on http://${host}:${port}`);
    fastify.log.info(`📊 Health check: http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

