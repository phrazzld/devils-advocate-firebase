import * as crypto from "crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";

admin.initializeApp();

// Create a new Cloud Function that is triggered when a user submits a request
exports.generateLicenseKey = functions.https.onRequest(
  async (request, response): Promise<any> => {
    // Validate that the request includes the user's email address
    if (!request.body.email) {
      return response.status(400).json({ error: "Email address is required" });
    }

    // Generate a random license key
    // TODO: Replace this with a more secure method of generating a license key
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
      // TODO: Configure the email transport
      //       Manage credentials securely
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "your-email@example.com",
          pass: "your-email-password",
        },
      });

      // TODO: Send the email
      await transporter.sendMail({
        from: "your-email@example.com",
        to: request.body.email,
        subject: "Your License Key",
        text: `Your license key is: ${licenseKey}`,
      });
    } catch (error) {
      return response.status(500).json({ error: "Error sending email" });
    }

    // Return the license key to the user
    return response.json({ licenseKey });
  }
);
