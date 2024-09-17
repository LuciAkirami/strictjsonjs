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
  if (typeof outputFormat === "object" && outputFormat !== null) {
    if (Array.isArray(outputFormat)) {
      // Process each item in the array, preserving the array structure
      return outputFormat.map((item) =>
        wrapWithAngleBrackets(item, delimiter, delimiter_num+1)
      );
    } else {
      let outputDict = {};

      // Wrap Keys with Delimiters
      for (const [key, value] of Object.entries(outputFormat)) {
        // In JavaScript, you can't directly multiply a string by a number like you can in Python. However, you can achieve a similar result by repeating a string using the repeat() method.
        let new_key =
          `${delimiter.repeat(delimiter_num)}` +
          key +
          `${delimiter.repeat(delimiter_num)}`;

        // Recursively process object values
        outputDict[new_key] = wrapWithAngleBrackets(
          value,
          delimiter,
          delimiter_num + 1
        );
      }
      // console.log(outputDict)
      return outputDict;
    }
  } else if (Array.isArray(outputFormat)) {
    return outputFormat.map((item) =>
      wrapWithAngleBrackets(item, delimiter, delimiter + 1)
    );
  } else if (typeof outputFormat === "string") {
    return `<${outputFormat}>`;
  }
}

let field =
  '{"###Sentiment###":"Positive","###Adjectives###":["beautiful","sunny"],"###Words###":"5"}';
// let myObj = {
//   Sentiment: "Type of Sentiment",
//   Adjectives: "Array of adjectives",
//   Words: "Number of words",
//   // YourResponse: 'Write your Response'
// }
// let myObj = {
//   Sentiment: "Type of Sentiment",
//   Adjectives: "Array of adjectives",
//   Words: "Number of words",
//   trees: [{ min_tress: "Minimum Trees", max_trees: "Max Trees" }],
// };
let myObj = {
  "Sentiment": "Type of Sentiment",
  "Adjectives": "Array of adjectives",
  "Words": "Number of words",
  "trees": [{"min_tress": "Minimum Trees", "max_trees": "Max Trees"}],
  "another": {
      "Sentiment": "Type of Sentiment",
      "Adjectives": "Array of adjectives",
      "Words": "Number of words",
      "trees": [{"min_tress": "Minimum Trees", "max_trees": "Max Trees"}],
  },
}
let keys = Object.keys(myObj);
let delimiter = "###";

let newOutputFormat = wrapWithAngleBrackets(myObj, delimiter, 1);
console.log("Wrapped Angled Brackets", newOutputFormat);
// null, 2 for pretty printing
console.log(JSON.stringify(newOutputFormat, null, 2))

function convertToObject(field, keys, delimiter) {
  let outputD = {};
  for (const idx in keys) {
    let key = keys[idx];
    if (
      !field.includes(`'${delimiter}${key}${delimiter}':`) &&
      !field.includes(`"${delimiter}${key}${delimiter}":`)
    ) {
      // ----- Yet to Do ------
      // try to fix the output if possible
      // Cases with no delimiter buyt with key and/or incomplete quotations
      // Cases with delimiter but with incomplete quotations
    }
  }

  // If the structure is Good, then extract the fields and keys using Regex
  const pattern = new RegExp(
    `,*\\s*['|\\"]${delimiter}([^#]*)${delimiter}['|\\"]:\\s*`
  );
  console.log(pattern);

  const trimmedField = field.slice(1, -1).trim();
  console.log(trimmedField);

  const matches = trimmedField.split(pattern);
  console.log(matches);

  // Remove Null Matches
  const notNullMatches = matches.filter((match) => match !== "");
  console.log(notNullMatches);

  // Remove any extra ' or " in the value matches
  const cleanedMatches = notNullMatches.map((match) =>
    ['"', '"'].includes(match[0]) ? match.slice(1, -1) : match
  );
  console.log(cleanedMatches);

  // Create a JavaScript Object
  for (let i = 0; i < cleanedMatches.length; i += 2) {
    outputD[cleanedMatches[i]] = cleanedMatches[i + 1];
  }

  console.log(outputD);
  return outputD;
}

// let a = ['Sam','Pam']
// const person = {fname:"John", lname:"Doe", age:25};
// let keys = Object.keys(person)
// convertToObject('',keys,'')

field =
  '{"###Sentiment###":"Positive","###Adjectives###":["beautiful","sunny"],"###Words###":"5"}';
myObj = {
  Sentiment: "Type of Sentiment",
  Adjectives: "Array of adjectives",
  Words: "Number of words",
  // YourResponse: 'Write your Response'
};
keys = Object.keys(myObj);
delimiter = "###";
// convertToObject(field, keys, delimiter)

function checkKey(
  field,
  outputFormat,
  newOutputFormat,
  delimiter,
  delimiterNum = 1
) {
  // let curDelimiter = delimiter * delimiterNum // this gives undefined as we cannot multiply string with number in js
  let curDelimiter = delimiter.repeat(delimiterNum);

  if (typeof outputFormat === "object" && outputFormat !== null) {
    // this is the processed output Object
    let outputD = {};
    // check key appears for each element in the output
    console.log(Object.keys(outputFormat));
    outputD = convertToObject(field, Object.keys(outputFormat), curDelimiter);

    // Check if the elements in the objects belong to their types
    const objectKeys = Object.keys(outputD);
    console.log(objectKeys);

    // Note that its "of" instead "in" for Object.entries
    for (let [key, value] of Object.entries(outputD)) {
      console.log(key, value);
      // outputD[key] = checkKey(value, outputFormat[key])
    }
  }
}

checkKey(field, myObj, "", delimiter, 1);

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
