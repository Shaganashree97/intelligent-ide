export const generateCodeUsingAi = async (prompt,language) => {
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


export async function debugWithAI(issues,code,language){
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
                text: `solve the following issues in my code in language ${language} and return only the resolved code: issues:${issues} my code: ${code} `,
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
