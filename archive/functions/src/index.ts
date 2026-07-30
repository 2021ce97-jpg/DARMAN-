import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─── Helper: send FCM to a user by uid ────────────────────────────────────────

async function sendPushToUser(
  uid: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    const fcmToken = userDoc.data()?.fcmToken as string | undefined;

    if (!fcmToken) {
      functions.logger.info(`No FCM token for user ${uid}, skipping push.`);
      return;
    }

    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority: "high",
        notification: {
          channelId: "mediconnect_channel",
          sound: "default",
          priority: "high",
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: "default",
            badge: 1,
          },
        },
      },
    });

    functions.logger.info(`Push sent to ${uid}: "${title}"`);
  } catch (err) {
    functions.logger.error(`Failed to send push to ${uid}:`, err);
  }
}

// ─── Helper: write an in-app notification to Firestore ───────────────────────

async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string,
  referenceId?: string
): Promise<void> {
  await db.collection("notifications").add({
    userId,
    title,
    body,
    type,
    isRead: false,
    ...(referenceId ? { referenceId } : {}),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 1: Appointment status changed
// Fires when any /appointments/{id} document is updated.
// ═══════════════════════════════════════════════════════════════════════════════

export const onAppointmentUpdated = functions.firestore
  .document("appointments/{appointmentId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const appointmentId = context.params.appointmentId;

    // Only act when status changes
    if (before.status === after.status) return;

    const patientId: string = after.patientId;
    const doctorId: string = after.doctorId;
    const doctorName: string = after.doctorName ?? "your doctor";
    const patientName: string = after.patientName ?? "a patient";
    const newStatus: string = after.status;

    switch (newStatus) {
      // ── Appointment approved by doctor ────────────────────────────────────
      case "approved": {
        const title = "Appointment Approved ✅";
        const body = `Your appointment with Dr. ${doctorName} has been approved!`;
        await Promise.all([
          sendPushToUser(patientId, title, body, {
            type: "appointment_approved",
            appointmentId,
          }),
          createNotification(
            patientId,
            title,
            body,
            "appointment_confirmed",
            appointmentId
          ),
        ]);
        break;
      }

      // ── Appointment cancelled ─────────────────────────────────────────────
      case "cancelled": {
        const reason: string = after.cancellationReason ?? "";
        const patientTitle = "Appointment Cancelled";
        const patientBody = reason
          ? `Your appointment was cancelled. Reason: ${reason}`
          : "Your appointment has been cancelled.";

        const doctorTitle = "Appointment Cancelled";
        const doctorBody = `${patientName}'s appointment has been cancelled.`;

        await Promise.all([
          sendPushToUser(patientId, patientTitle, patientBody, {
            type: "appointment_cancelled",
            appointmentId,
          }),
          sendPushToUser(doctorId, doctorTitle, doctorBody, {
            type: "appointment_cancelled",
            appointmentId,
          }),
          createNotification(
            patientId,
            patientTitle,
            patientBody,
            "appointment_cancelled",
            appointmentId
          ),
        ]);
        break;
      }

      // ── Appointment completed ─────────────────────────────────────────────
      case "completed": {
        const title = "Appointment Completed ✅";
        const body = `Your appointment with Dr. ${doctorName} is complete. Please leave a review!`;
        await Promise.all([
          sendPushToUser(patientId, title, body, {
            type: "appointment_completed",
            appointmentId,
          }),
          createNotification(
            patientId,
            title,
            body,
            "appointment_confirmed",
            appointmentId
          ),
        ]);
        break;
      }

      // ── Appointment rescheduled ───────────────────────────────────────────
      case "rescheduled": {
        const newDate = after.dateTime?.toDate?.()?.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) ?? "a new date";
        const title = "Appointment Rescheduled 📅";
        const body = `Your appointment with Dr. ${doctorName} has been moved to ${newDate}.`;
        await Promise.all([
          sendPushToUser(patientId, title, body, {
            type: "appointment_rescheduled",
            appointmentId,
          }),
          createNotification(
            patientId,
            title,
            body,
            "appointment_confirmed",
            appointmentId
          ),
        ]);
        break;
      }
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 2: New appointment created
// Notifies the doctor immediately when a patient books with them.
// ═══════════════════════════════════════════════════════════════════════════════

export const onAppointmentCreated = functions.firestore
  .document("appointments/{appointmentId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const appointmentId = context.params.appointmentId;

    const doctorId: string = data.doctorId;
    const patientName: string = data.patientName ?? "A patient";
    const dateTime: admin.firestore.Timestamp | undefined = data.dateTime;

    const dateStr = dateTime?.toDate?.()?.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) ?? "Unknown time";

    const title = "New Appointment Request 🏥";
    const body = `${patientName} has booked an appointment for ${dateStr}. Please review.`;

    // Look up the doctor's userId to send push
    const doctorDoc = await db.collection("doctors").doc(doctorId).get();
    const doctorUserId = doctorDoc.data()?.userId as string | undefined;

    if (doctorUserId) {
      await Promise.all([
        sendPushToUser(doctorUserId, title, body, {
          type: "new_appointment",
          appointmentId,
        }),
        createNotification(
          doctorUserId,
          title,
          body,
          "appointment_confirmed",
          appointmentId
        ),
      ]);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 3: Doctor verification status changed
// Notifies doctor when admin approves or rejects their profile.
// ═══════════════════════════════════════════════════════════════════════════════

export const onDoctorVerified = functions.firestore
  .document("doctors/{doctorId}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only act when status changes
    if (before.status === after.status) return;

    const doctorUserId: string | undefined = after.userId;
    if (!doctorUserId) return;

    const newStatus: string = after.status;

    if (newStatus === "Verified") {
      const title = "Verification Approved ✅";
      const body =
        "Congratulations! Your DARMAN doctor profile has been verified. You can now accept patient appointments.";
      await Promise.all([
        sendPushToUser(doctorUserId, title, body, { type: "doctor_verified" }),
        createNotification(doctorUserId, title, body, "general"),
      ]);
    } else if (newStatus === "Rejected") {
      const title = "Verification Not Approved";
      const body =
        "Your doctor verification was not approved. Please check your submitted documents and contact support@darman.af.";
      await Promise.all([
        sendPushToUser(doctorUserId, title, body, { type: "doctor_rejected" }),
        createNotification(doctorUserId, title, body, "general"),
      ]);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 4: Admin notification broadcast
// When admin creates a notification with target='all', send push to all users.
// ═══════════════════════════════════════════════════════════════════════════════

export const onAdminBroadcast = functions.firestore
  .document("admin_broadcasts/{broadcastId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    const title: string = data.title ?? "DARMAN Update";
    const body: string = data.body ?? "";
    const targetRole: string | undefined = data.targetRole; // 'patient' | 'doctor' | 'all'

    if (!body) return;

    try {
      // Query all users (optionally filtered by role)
      let query: admin.firestore.Query = db.collection("users");
      if (targetRole && targetRole !== "all") {
        query = query.where("role", "==", targetRole);
      }

      const usersSnap = await query.get();
      const tokens: string[] = [];

      usersSnap.forEach((doc) => {
        const token = doc.data().fcmToken as string | undefined;
        const isBanned = doc.data().isBanned === true;
        if (token && !isBanned) tokens.push(token);
      });

      if (tokens.length === 0) return;

      // Send in batches of 500 (FCM limit per multicast)
      const BATCH_SIZE = 500;
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batch = tokens.slice(i, i + BATCH_SIZE);
        await messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          android: { priority: "high" },
        });
      }

      functions.logger.info(
        `Broadcast sent to ${tokens.length} users (role: ${targetRole ?? "all"})`
      );
    } catch (err) {
      functions.logger.error("Broadcast failed:", err);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER 5: Prescription written
// Notifies patient when doctor writes a prescription.
// ═══════════════════════════════════════════════════════════════════════════════

export const onPrescriptionCreated = functions.firestore
  .document("prescriptions/{prescriptionId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const prescriptionId = context.params.prescriptionId;
    const patientId: string = data.patientId;
    const doctorName: string = data.doctorName ?? "Your doctor";

    const title = "Prescription Ready 💊";
    const body = `Dr. ${doctorName} has written a prescription for you. View it in your Health Records.`;

    await Promise.all([
      sendPushToUser(patientId, title, body, {
        type: "prescription_ready",
        prescriptionId,
      }),
      createNotification(
        patientId,
        title,
        body,
        "prescription_ready",
        prescriptionId
      ),
    ]);
  });

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER X: New chat message created — send FCM + in-app notification
// Also update message metadata with delivered timestamps per recipient
// ═══════════════════════════════════════════════════════════════════════════════

export const onChatMessageCreated = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    if (!data) return;

    const senderId: string = data.senderId;
    const content: string = data.content ?? '';

    try {
      // Load chat participants
      const chatDoc = await db.collection('chats').doc(chatId).get();
      const participants: string[] = chatDoc.data()?.participants || [];

      // Notify all recipients (participants excluding sender)
      const recipients = participants.filter((p) => p && p !== senderId);

      await Promise.all(recipients.map(async (recipientId) => {
        try {
          const title = 'New message';
          const body = content.length > 120 ? content.substring(0, 117) + '...' : content;

          // Send push and create in-app notification
          await sendPushToUser(recipientId, title, body, {
            type: 'chat_message',
            chatId,
            messageId,
          });

          await createNotification(recipientId, title, body, 'chat_message', chatId);

          // Mark message as delivered to this recipient in metadata.deliveredTo
          const field = `metadata.deliveredTo.${recipientId}`;
          await db.collection('chats').doc(chatId).collection('messages').doc(messageId).set({
            [field]: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        } catch (err) {
          functions.logger.error('Failed to notify recipient', recipientId, err);
        }
      }));
    } catch (err) {
      functions.logger.error('onChatMessageCreated error:', err);
    }
  });
