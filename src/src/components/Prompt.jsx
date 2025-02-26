import React, { useState } from "react";
import "./prompt.css";

const Prompt = ({ defaultValue, onSubmit, onCancel }) => {
  const [value, setValue] = useState(defaultValue || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(value);
  };

  return (
    <div className="prompt-overlay">
      <div className="prompt-container">
        <form onSubmit={handleSubmit}>
          <h3>Enter code to generate</h3>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
          <div className="prompt-buttons">
            <button type="submit">OK</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Prompt;
