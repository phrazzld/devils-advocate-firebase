import * as functions from "firebase-functions";
import { Configuration, OpenAIApi } from "openai";

exports.helloWorld = functions.https.onRequest((_request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

// Define Answer enum for yes/no
enum Answer {
  Yes = "yes",
  No = "no",
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const containsArgument = async (text: string): Promise<Answer> => {
  const response = await openai.createCompletion({
    prompt: 'Is this text making an argument? Answer "yes" or "no". '.concat(
      text
    ),
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });

  // Return "yes" or "no"
  const answer = response.data.choices[0].text;
  if (!answer) {
    throw new Error("Could not determine if text contains an argument.");
  }

  return answer.trim().toLowerCase() === "yes" ? Answer.Yes : Answer.No;
};

exports.containsArgument = functions.https.onCall(
  (data: { text: string }, _context) => {
    // Ensure that the text argument is provided
    if (!data.text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Ensure that the caller has provided a string value for the text argument
    if (typeof data.text !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    return containsArgument(data.text);
  }
);

const getCoreArgument = async (text: string): Promise<string> => {
  const response = await openai.createCompletion({
    prompt: "What is the core argument of this text?".concat(text),
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });

  // If no core argument was found, throw an error
  if (!response.data.choices[0].text) {
    throw new Error("No core argument found.");
  }

  // Return the core argument
  return response.data.choices[0].text;
};

// Export getCoreArgument function
exports.getCoreArgument = functions.https.onCall(
  (data: { text: string }, _context) => {
    // Ensure that the text argument is provided
    if (!data.text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Ensure that the caller has provided a string value for the text argument
    if (typeof data.text !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    return getCoreArgument(data.text);
  }
);

const writeCounterargument = async (text: string): Promise<string> => {
  // Analyze the text using GPT-3's language modeling capabilities
  const response = await openai.createCompletion({
    prompt: "Write a counterargument to this text.".concat(text),
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });

  // If no counterargument was found, throw an error
  if (!response.data.choices[0].text) {
    throw new Error("Could not write a counterargument.");
  }

  // Return the counterargument
  return response.data.choices[0].text;
};

exports.writeCounterargument = functions.https.onCall(
  (data: { text: string }, _context) => {
    // Ensure that the text argument is provided
    if (!data.text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Ensure that the caller has provided a string value for the text argument
    if (typeof data.text !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    return writeCounterargument(data.text);
  }
);

const analyzeText = async (text: string): Promise<string> => {
  // Check if the text contains an argument
  const hasArg = await containsArgument(text);

  // If the text contains an argument, get the core argument
  if (hasArg === Answer.Yes) {
    const coreArgument = await getCoreArgument(text);

    // Write a counterargument to the core argument
    const counterargument = await writeCounterargument(coreArgument);
    return counterargument;
  } else {
    return "No argument found.";
  }
};

exports.analyzeText = functions.https.onCall(
  (data: { text: string }, _context) => {
    // Ensure that the text argument is provided
    if (!data.text) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    // Ensure that the caller has provided a string value for the text argument
    if (typeof data.text !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with one argument 'text' containing the text to analyze."
      );
    }

    return analyzeText(data.text);
  }
);
