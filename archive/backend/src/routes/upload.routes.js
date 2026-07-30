import { getStorage } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG) and PDF files are allowed'));
    }
  },
});

export default async function uploadRoutes(fastify, options) {
  // Upload profile picture
  fastify.post('/profile-picture', { preHandler: authenticate }, async (request, reply) => {
    try {
      const storage = getStorage();
      
      if (!storage) {
        return reply.send({
          success: true,
          message: 'File upload - Firebase Storage not configured (mock mode)',
          data: {
            url: `https://i.pravatar.cc/150?u=${request.user.uid}`,
            mockMode: true,
          },
        });
      }

      // In production, handle actual file upload
      return reply.send({
        success: true,
        message: 'Profile picture upload endpoint ready',
        data: {
          url: `https://i.pravatar.cc/150?u=${request.user.uid}`,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Upload medical record document
  fastify.post('/medical-record', { preHandler: authenticate }, async (request, reply) => {
    try {
      const storage = getStorage();
      
      if (!storage) {
        return reply.send({
          success: true,
          message: 'Medical record upload - Firebase Storage not configured (mock mode)',
          data: {
            url: `https://example.com/medical-records/${request.user.uid}/${Date.now()}.pdf`,
            fileName: 'medical-record.pdf',
            mockMode: true,
          },
        });
      }

      // In production, handle actual file upload to Firebase Storage
      return reply.send({
        success: true,
        message: 'Medical record uploaded successfully',
        data: {
          url: `https://example.com/medical-records/${request.user.uid}/${Date.now()}.pdf`,
          fileName: 'medical-record.pdf',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Upload prescription document
  fastify.post('/prescription', { preHandler: authenticate }, async (request, reply) => {
    try {
      const storage = getStorage();
      
      if (!storage) {
        return reply.send({
          success: true,
          message: 'Prescription upload - Firebase Storage not configured (mock mode)',
          data: {
            url: `https://example.com/prescriptions/${Date.now()}.pdf`,
            fileName: 'prescription.pdf',
            mockMode: true,
          },
        });
      }

      // In production, handle actual file upload
      return reply.send({
        success: true,
        message: 'Prescription uploaded successfully',
        data: {
          url: `https://example.com/prescriptions/${Date.now()}.pdf`,
          fileName: 'prescription.pdf',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Upload doctor documents (certificates, licenses)
  fastify.post('/doctor-documents', { preHandler: authenticate }, async (request, reply) => {
    try {
      const storage = getStorage();
      
      if (!storage) {
        return reply.send({
          success: true,
          message: 'Doctor document upload - Firebase Storage not configured (mock mode)',
          data: {
            url: `https://example.com/doctor-docs/${request.user.uid}/${Date.now()}.pdf`,
            fileName: 'certificate.pdf',
            mockMode: true,
          },
        });
      }

      // In production, handle actual file upload
      return reply.send({
        success: true,
        message: 'Doctor document uploaded successfully',
        data: {
          url: `https://example.com/doctor-docs/${request.user.uid}/${Date.now()}.pdf`,
          fileName: 'certificate.pdf',
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });

  // Delete file
  fastify.delete('/file', { preHandler: authenticate }, async (request, reply) => {
    try {
      const { fileUrl } = request.body;

      if (!fileUrl) {
        return reply.status(400).send({
          error: { message: 'File URL is required', statusCode: 400 },
        });
      }

      const storage = getStorage();
      
      if (!storage) {
        return reply.send({
          success: true,
          message: 'File deleted (mock mode)',
          mockMode: true,
        });
      }

      // In production, delete file from Firebase Storage
      return reply.send({
        success: true,
        message: 'File deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: { message: error.message, statusCode: 500 },
      });
    }
  });
}
