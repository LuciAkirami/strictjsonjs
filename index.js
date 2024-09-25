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

function processField(field) {
  // 1. Decode double backslashes (handling \n, \t, etc.)
  field = field.replace(/\\n/g, '\n')
               .replace(/\\t/g, '\t')
               .replace(/\\r/g, '\r')
               .replace(/\\\\/g, '\\');  // Replace \\ with a single \

  // 2. Replace the specific byte sequence 'â\x80\x99' with an apostrophe (')
  field = field.replace(/â\x80\x99/g, "'");

  // 3. Remove 'python', backticks(```), and leading whitespace
  field = field.replace(/^\s*`*(python)?\s*/i, "");  // case-insensitive for 'python'

  // 4. Remove trailing whitespace and backticks from end
  field = field.replace(/(\s|`)*$/g, "");

  return field;
}

function convertToList(field, chat=llm){
  // Converts a string field into a lsit using LLM to list out element line by line
  let systemMessage = "Output each element of the list in a new line starting with (%item) and ending with \n, e.g. ['hello', 'world'] -> (%item) hello\n(%item) world\nStart your response with (%item) and do not provide explanation"
  let userMessage = String(field)
  let response = chat(systemMessage, userMessage)

  // Extract all the items into a list
  let pattern = /\(%item\)\s*(.*?)\n*(?=\(%item\))/gs;
  let list = [...response.matchAll(pattern)].map(match => match[1])
  return list 
}

function typeCheckAndConvert(field, key, data_type){
  if (data_type.toLowerCase() === 'str'){
    try {
      // converting to string
      field = String(field)
    } catch (error) {
      // 
    }

    if (typeof field !== 'string') {
      throw new Error(`Output field of "${key}" not of data type ${data_type}. If not possible to match, output ''`)
    }
  }

  // code is a special case of string, where we remove double backslashes
  if (data_type.toLowerCase() === 'code') {
    try {
      // converting to string
      field = String(field)
    } catch (error) {
      // 
    }

    if (typeof field !== 'string') {
      throw new Error(`Output field of "${key}" not of data type ${data_type}. If not possible to match, output ''`)
    }

    // perform different operations
    field = processField(field)
  }

  // checking for intiger
  if (data_type.toLowerCase() === 'int') {
    try {
      // converting to int
      field = parseInt(field)
    } catch (error) {
      // 
    }

    if (Number.isInteger(field)) {
      throw new Error(`Output field of "${key}" not of data type ${data_type}. If not possible to match, output 0`)
    }
  }

  // checking for float
  if (data_type.toLowerCase() === 'float') {
    try {
      // converting to float
      field = parseFloat(field)
    } catch (error) {
      // 
    }

    //  isFinite() checks if given data is a number or not
    // and Number.isInteger() checks if its a Integer or not
    // so if the data is a number but not an Integer, then its a float
    if (!Number.isInteger(field) && Number.isFinite(field)) {
      throw new Error(`Output field of "${key}" not of data type ${data_type}. If not possible to match, output 0.0`)
    }
  }

  // checking for bool
  if (data_type.toLowerCase() === 'bool') {
    // first convert tot string
    field = String(field)

    // then convert to bool
    if ('true' === field.substring(0,4).toLowerCase()){
      field = true
    } else if ('false' === field.substring(0,5).toLowerCase()) {
      field = false
    }

    else {
      throw new Error(`Output field of "${key}" not of data type ${data_type}. If not possible to match, output True`)
    }
  }

  // checking for enum
  if (data_type.toLowerCase() === 'enum') {
    try {
      // converting the enum list to an Array
      // Eg: String: "Enum['Positive','Negative']" -> Array: ['Positive','Negative']
      values = JSON.parse(data_type.substring(4).replace(/'/g,'"')) // replace ' with "
    } catch (error) {
      // 
    }

    if (!values.includes(field)) {
      throw new Error(`Output field of "${key}" (${field}) not one of {values}. If not possible to match, output ${values[0]}`)
    }
  }
}

function wrapWithAngleBrackets(outputFormat, delimiter, delimiter_num) {
  if (typeof outputFormat === "object" && outputFormat !== null) {
    // In js, Arrays are of type objects too
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
export { strictJson, convertToList };
