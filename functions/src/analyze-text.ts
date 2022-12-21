import * as functions from "firebase-functions";
import { analyze } from "./openai";
// import firestore
import * as admin from "firebase-admin";

admin.initializeApp();

export const analyzeText = functions.https.onRequest(
  async (request, response): Promise<any> => {
    // Ensure that the text argument is provided
    if (!request.body.text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Ensure that the caller has provided a string value for the text argument
    if (typeof request.body.text !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Check the header for a license
    if (!request.headers.authorization) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called with a valid license key."
      );
    }

    // Check the license key
    const licenseKey = request.headers.authorization.split("Bearer ")[1];
    const licenseDoc = await admin
      .firestore()
      .collection("licenseKeys")
      .doc(licenseKey)
      .get();

    if (!licenseDoc.exists) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called with a valid license key."
      );
    }

    // Check the number of requests the calling license has made this past month
    const now = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);

    // Get current uses off license

    const querySnapshot = await admin
      .firestore()
      .collection("licenseKeys")
      .doc(licenseKey)
      .collection("requests")
      .where("createdAt", ">", monthAgo)
      .get();

    if (querySnapshot.size >= 100) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "The license key has exceeded the maximum number of requests for the month."
      );
    }

    // Analyze the text
    const analysis = await analyze(request.body.text);

    // Save the request to the database
    await admin
      .firestore()
      .collection("licenseKeys")
      .doc(licenseKey)
      .collection("requests")
      .add({
        text: request.body.text,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return response.json(analysis);
  }
);
