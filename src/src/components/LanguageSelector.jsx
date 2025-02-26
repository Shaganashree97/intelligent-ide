import React, { useState } from "react";
import { generateCodeUsingAi } from "../utils/aiHelper";
import Prompt from "./Prompt";

const LanguageSelector = ({ onLanguageChange, onCodeGenerated }) => {
  const [language, setLanguage] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  const handleAcceptLanguage = () => {
    if (language) {
      onLanguageChange(language);
      alert(`you have selected ${language}`);
    }
  };

  const handlePromptSubmit = async (prompt) => {
    if (prompt) {
      try {
        const generatedCode = await generateCodeUsingAi(prompt);
        if (generatedCode) {
          const lines = generatedCode.split("\n");
          console.log(lines);

          onCodeGenerated(lines.slice(1, lines.length - 1).join("\n"));
        }
      } catch (error) {
        console.error("Error generating code:", error);
        alert("Failed to generate code. Please try again.");
      }
    }
    setShowPrompt(false);
  };

  return (
    <div className="more-opt">
      <div>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">select language</option>
          <option value="python">python</option>
          <option value="javascript">javascript</option>
          <option value="java">java</option>
          <option value="c">c</option>
          <option value="html">html</option>
          <option value="css">css</option>
        </select>
        <button onClick={handleAcceptLanguage}>accept language</button>
        {/* <button onClick={() => setShowPrompt(true)}>Generate using ai</button> */}
      </div>
      {showPrompt && (
        <Prompt
          defaultValue="generate a function to add numbers"
          onSubmit={handlePromptSubmit}
          onCancel={() => setShowPrompt(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;
