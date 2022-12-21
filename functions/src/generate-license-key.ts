import * as sgMail from "@sendgrid/mail";
import * as crypto from "crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
/* import * as nodemailer from "nodemailer"; */

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

admin.initializeApp();

// Create a new Cloud Function that is triggered when a user submits a request
export const generateLicenseKey = functions.https.onRequest(
  async (request, response): Promise<any> => {
    // Validate that the request includes the user's email address
    if (!request.body.email) {
      return response.status(400).json({ error: "Email address is required" });
    }

    // TODO: Only generate a license key if the user has paid

    // Generate a random license key
    const licenseKey = crypto.randomBytes(32).toString("hex");

    // Save the license key and email address in the Firestore database
    try {
      await admin.firestore().collection("licenseKeys").doc(licenseKey).set({
        email: request.body.email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      return response.status(500).json({ error: "Error saving license key" });
    }

    // Send an email to the user with their license key
    try {
      // Write message containing license key
      const msg = {
        to: request.body.email,
        from: "devils-advocate.hydat@simplelogin.com",
        subject: "Your license key for Devil's Advocate",
        text: `Your license key is ${licenseKey}`,
        html: `Your license key is <strong>${licenseKey}</strong>`,
      };

      // Send email
      await sgMail.send(msg);
    } catch (error) {
      return response.status(500).json({ error: "Error sending email" });
    }

    // Return the license key to the user
    return response.json({ licenseKey });
  }
);
