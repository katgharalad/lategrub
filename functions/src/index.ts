import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendVerificationCode = functions.firestore
  .document('verification_codes/{docId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const { email, code } = data;

    try {
      // Use Firebase Admin SDK to send the email
      await admin.auth().generateEmailVerificationLink(email, {
        url: `${functions.config().app.url}/verify-email`,
      });

      // For development, log the code
      if (process.env.FUNCTIONS_EMULATOR) {
        console.log('Verification code for', email, ':', code);
      }

      // Update the document to mark it as processed
      await snap.ref.update({
        emailSent: true,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new functions.https.HttpsError('internal', 'Error sending verification email');
    }
  }); 