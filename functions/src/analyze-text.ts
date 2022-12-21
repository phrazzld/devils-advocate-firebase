import * as functions from "firebase-functions";
import { analyze } from "./openai";

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

    const analysis = await analyze(request.body.text);

    return response.json(analysis);
  }
);
