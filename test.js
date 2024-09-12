import { strictJson } from "./index.js";
//  Calling using Async Await
async function main() {
  try {
    const response = await strictJson(
      "You are a helpful Assistant",
      "It is a beautiful and sunny day",
      {
        Sentiment: "Type of Sentiment",
        Adjectives: "Array of adjectives",
        Words: "Number of words",
      }
    );

    console.log("Response from strictJson:");
    console.log(response);
  } catch (error) {
    console.error("Error calling strictJson:", error);
  }
}

// Run the main function
main();

// Calling using Promises
// Call the strictJson function and handle response using .then() and .catch()
strictJson("You are a helpful Assistant", "It is a beautiful and sunny day", {
  Sentiment: "Type of Sentiment",
  Adjectives: "Array of adjectives",
  Words: "Number of words",
})
  .then((response) => {
    console.log("Response from strictJson:");
    console.log(response);
  })
  .catch((error) => {
    console.error("Error calling strictJson:", error);
  });

// Using Immediately Invoked Function Expression (IIFE)
// Immediately Invoked Function Expression (IIFE)
(async () => {
  try {
    const response = await strictJson(
      "You are a helpful Assistant",
      "It is a beautiful and sunny day",
      {
        Sentiment: "Type of Sentiment",
        Adjectives: "Array of adjectives",
        Words: "Number of words",
      }
    );

    console.log("Response from strictJson:");
    console.log(response);
  } catch (error) {
    console.error("Error calling strictJson:", error);
  }
})();
