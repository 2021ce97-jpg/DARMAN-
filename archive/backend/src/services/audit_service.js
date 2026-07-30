import { getFirestore } from '../config/firebase.js';

export async function writeAuditLog({
  actorId = 'system',
  actorRole = 'unknown',
  action,
  entityType,
  entityId,
  metadata = {},
  request,
}) {
  try {
    const db = getFirestore();
    await db.collection('audit_logs').add({
      actorId,
      actorRole,
      action,
      entityType,
      entityId,
      metadata,
      ip: request?.ip || null,
      userAgent: request?.headers?.['user-agent'] || null,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    // Audit logging should never break the user-facing flow.
    console.error('Audit log write failed:', error.message);
  }
}
