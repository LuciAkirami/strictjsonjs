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

function convertToObject(
  field,
  keys,
  delimiter
) {
  let outputD = {}
  for (const idx in keys) {
    let key = keys[idx]
    if (!field.includes(`'${delimiter}${key}${delimiter}':`) && !field.includes(`"${delimiter}${key}${delimiter}":`)) {
      // ----- Yet to Do ------
      // try to fix the output if possible
      // Cases with no delimiter buyt with key and/or incomplete quotations

      // Cases with delimiter but with incomplete quotations
    }

    
  }
  
  // If the structure is Good, then extract the fields and keys using Regex
  const pattern = new RegExp(`,*\\s*['|\\"]${delimiter}([^#]*)${delimiter}['|\\"]:\\s*`);
  console.log(pattern);

  const trimmedField = field.slice(1, -1).trim();
  console.log(trimmedField)

  const matches = trimmedField.split(pattern)
  console.log(matches)

  // Remove any extra ' or " in the matches
  const cleanedMatches = matches.map(match => ['"', '"'].includes(match[0]) ? match.slice(1,-1) : match)
  console.log(cleanedMatches)




  
}

// let a = ['Sam','Pam']
// const person = {fname:"John", lname:"Doe", age:25};
// let keys = Object.keys(person)
// convertToObject('',keys,'')

let field = '{"###Sentiment###":"Positive","###Adjectives###":["beautiful","sunny"],"###Words###":"5"}'
let myObj = {
  Sentiment: "Type of Sentiment",
  Adjectives: "Array of adjectives",
  Words: "Number of words",
  // YourResponse: 'Write your Response'
}
let keys = Object.keys(myObj)
let delimiter = '###'
convertToObject(field, keys, delimiter)





function checkKey(
  field,
  outputFormat,
  newOutputFormat,
  delimiter,
  delimiterNum = 1
) {
  curDelimiter = delimiter * delimiterNum
  // this is thje processed output Object 
  outputD = {}
  // check key appears for each element in the output
  outputD = convertToObject(field, Object.keys(outputFormat), curDelimiter)

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

  for (let i = 0; i < 3; i++) {
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

    try {
      return response;
    } catch (err) {
      errorMessage = `\n\nPrevious json: ${response}\njson error: ${String(
        err
      )}\nFix the error.`;
      console.log("An exception occurred:", String(err));
      console.log("Current invalid json format:", response);
    }

    return {};
  }
}

// Export the strictJson function
export { strictJson };
