import * as functions from "firebase-functions";
import { Configuration, OpenAIApi } from "openai";

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
  functions.logger.info(`containsArgument core function, text: ${text}`, {
    structuredData: true,
  });
  const response = await openai.createCompletion({
    prompt: `
Does the text below make an argument? Answer "yes" or "no".

Text: """
${text}
"""
`,
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });
  functions.logger.info(
    `containsArgument core function, response.data: ${response.data}`,
    { structuredData: true }
  );

  // Return "yes" or "no"
  const answer = response.data.choices[0].text;
  if (!answer) {
    throw new Error("Could not determine if text contains an argument.");
  }

  return answer.trim().toLowerCase() === "yes" ? Answer.Yes : Answer.No;
};

const getCoreArgument = async (text: string): Promise<string> => {
  const response = await openai.createCompletion({
    prompt: `
Summarize the core argument of the text below (in one or two sentences).

Text: """
${text}
"""

Summary:
`,
    model: "text-davinci-003",
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

const rearticulateCoreArgument = async (text: string): Promise<string> => {
  const response = await openai.createCompletion({
    prompt: `
Write one persuasive paragraph that forwards the argument put forth in the text below.

Text: """
${text}
"""

Persuasive paragraph:
`,
    model: "text-davinci-003",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });

  // If no rearticulated core argument was found, throw an error
  if (!response.data.choices[0].text) {
    throw new Error("No rearticulated core argument found.");
  }

  // Return the rearticulated core argument
  return response.data.choices[0].text;
};

const writeCounterargument = async (text: string): Promise<string> => {
  // Analyze the text using GPT-3's language modeling capabilities
  const response = await openai.createCompletion({
    prompt: `
Write a short, persuasive essay whose thesis is a counterargument to the text below.

Text: """
${text}
"""

Counterargument:
`,
    model: "text-davinci-003",
    temperature: 0.5,
    max_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    best_of: 1,
  });
  functions.logger.info(`writeCounterargument core function, response.data:`, {
    structuredData: true,
  });
  functions.logger.info(response.data, { structuredData: true });

  // If no counterargument was found, throw an error
  if (!response.data.choices[0].text) {
    throw new Error("Could not write a counterargument.");
  }

  // Return the counterargument
  return response.data.choices[0].text;
};

interface Analysis {
  containsArgument: Answer;
  coreArgument: string | null;
  rearticulatedCore: string | null;
  counterargument: string | null;
}

export const analyze = async (text: string): Promise<Analysis> => {
  // Check if the text contains an argument
  const hasArg = await containsArgument(text);

  // If the text contains an argument, get the core argument
  if (hasArg === Answer.Yes) {
    const coreArgument = await getCoreArgument(text);

    // Rearticulate the core argument
    const rearticulatedCore = await rearticulateCoreArgument(coreArgument);

    // Write a counterargument to the core argument
    const counterargument = await writeCounterargument(rearticulatedCore);

    return {
      containsArgument: Answer.Yes,
      coreArgument,
      rearticulatedCore,
      counterargument,
    };
  } else {
    return {
      containsArgument: Answer.No,
      coreArgument: null,
      rearticulatedCore: null,
      counterargument: null,
    };
  }
};
