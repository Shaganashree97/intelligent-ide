export const generateCodeUsingAi = async (prompt, language) => {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Only return code no other texts for the following prompt and don't add the code block for formatting: ${prompt} using programming language ${language}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating code:", error);
    return null;
  }
};

export const extractCodeFromResponse = (response) => {
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);
  console.log("Codeblock match: ", match);
  return match ? match[1] : response;
};

const askAI = async (prompt) => {
  try {
    console.log("Sending request to AI API:", prompt);

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-coder",
        prompt,
        stream: false,
      }),
    });
    const respJson = await response.json();
    console.log(respJson);
    return respJson.response;
  } catch (error) {
    console.error("AI API error:", error);
    throw error;
  }
};

// export async function debugWithAI(issues, code, language) {
//   console.log(issues.message);
//   return askAI(
//     `dont add or remove any piece of code without context and debug the following code: \`\`\`${language}\n${code}\`\`\`, programming language: ${language}, issues: ${issues.message}, dont't include comments or any explanations,don't give explanations return only the code`,
//   );
// }
//

export async function debugWithAI(issues, code, language) {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `solve the following issues in my code in language ${language} and return only the resolved code: issues:${issues.message} my code: ${code} `,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating code:", error);
    return null;
  }
}
