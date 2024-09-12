import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

async function llm(system_prompt, user_prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = model.startChat();

  let prompt = system_prompt + "\n" + user_prompt;
  let result = await chat.sendMessage(prompt);

  return result.response.text();
}

// Helper Functions

function wrapWithAngleBrackets(outputFormat, delimiter, delimiter_num) {
  let outputDict = {};

  for (const [key, value] of Object.entries(outputFormat)) {
    // In JavaScript, you can't directly multiply a string by a number like you can in Python. However, you can achieve a similar result by repeating a string using the repeat() method.
    let new_key =
      `${delimiter.repeat(delimiter_num)}` +
      key +
      `${delimiter.repeat(delimiter_num)}`;

    let new_val = `<${value}>`;

    outputDict[new_key] = new_val;
  }

  return outputDict;
}

async function strictJson(
  systemPrompt,
  userPrompt,
  outputFormat,
  delimiter = "###",
  numTries = 3
) {
  let errorMessage = "";
  let newOutputFormat = wrapWithAngleBrackets(outputFormat, delimiter, 1);
  // console.log(newOutputFormat);

  // using JSON.stringify(newOutputFormat) instead just newOutputFormat as keeping the
  // later will output [object Object]
  let outputFormatPrompt = `\nOutput in the following json template: \`\`\`${JSON.stringify(
    newOutputFormat
  )}\`\`\`
Update values enclosed in <> and remove the <>. 
Your response must only be the updated json template beginning with {{ and ending with }}
Ensure the following output keys are present in the json: ${Object.keys(
    newOutputFormat
  ).join(" ")}`;

  systemPrompt = String(systemPrompt) + outputFormatPrompt + errorMessage;
  userPrompt = String(userPrompt);

  let response = await llm(systemPrompt, userPrompt);

  // Get the Context present between the opening and closing brackets
  // Add the { and } if the LLM does not generate them
  let startIdx = response.indexOf("{");
  if (startIdx === -1) {
    startIdx = 0;
    response = "{" + response;
  }

  let endIdx = response.lastIndexOf("}");
  if (endIdx === -1) {
    response = response + "}";
    endIdx = response.length + 1;
  }

  response = response.substring(startIdx, endIdx + 1);

  return response;
}

// Export the strictJson function
export { strictJson };
