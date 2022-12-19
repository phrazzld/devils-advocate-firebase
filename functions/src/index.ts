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

const PROMPTS = {
  CONTAINS_ARGUMENT: 'Is this text making an argument? Answer "yes" or "no". ',
  CORE_ARGUMENT: "What is the core argument of this text? ",
  WRITE_COUNTER: "Write the most persuasive counterargument to the following text: ",
};

const containsArgument = async (text: string): Promise<Answer> => {
  functions.logger.info(`containsArgument core function, text: ${text}`, { structuredData: true });
  const response = await openai.createCompletion({
    prompt: PROMPTS.CONTAINS_ARGUMENT.concat(text),
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });
  functions.logger.info(`containsArgument core function, response.data: ${response.data}`, { structuredData: true });

  // Return "yes" or "no"
  const answer = response.data.choices[0].text;
  if (!answer) {
    throw new Error("Could not determine if text contains an argument.");
  }

  return answer.trim().toLowerCase() === "yes" ? Answer.Yes : Answer.No;
};

exports.containsArgument = functions.https.onRequest(
  async (request, response) => {
  functions.logger.info(`containsArgument wrapper function, request.body: ${request.body}`, { structuredData: true });
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

    response.send(await containsArgument(request.body.text));
  }
);

const getCoreArgument = async (text: string): Promise<string> => {
  const response = await openai.createCompletion({
    prompt: PROMPTS.CORE_ARGUMENT.concat(text),
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
exports.getCoreArgument = functions.https.onRequest(
  async (request, response) => {
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

    response.send(await getCoreArgument(request.body.text));
  }
);

const writeCounterargument = async (text: string): Promise<string> => {
  // Analyze the text using GPT-3's language modeling capabilities
  const response = await openai.createCompletion({
    prompt: PROMPTS.WRITE_COUNTER.concat(text),
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

exports.writeCounterargument = functions.https.onRequest(
  async (request, response) => {
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

    response.send(await writeCounterargument(request.body.text));
  }
);

interface Analysis {
  containsArgument: Answer;
  coreArgument: string | null;
  counterargument: string | null;
}

const analyzeText = async (text: string): Promise<Analysis> => {
  // Check if the text contains an argument
  const hasArg = await containsArgument(text);

  // If the text contains an argument, get the core argument
  if (hasArg === Answer.Yes) {
    const coreArgument = await getCoreArgument(text);

    // Write a counterargument to the core argument
    const counterargument = await writeCounterargument(coreArgument);

    return {
      containsArgument: Answer.Yes,
      coreArgument,
      counterargument,
    }
  } else {
    return {
      containsArgument: Answer.No,
      coreArgument: null,
      counterargument: null,
    }
  }
};

exports.analyzeText = functions.https.onRequest(async (request, response) => {
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

  const analysis = await analyzeText(request.body.text)

  response.json(analysis);
});
