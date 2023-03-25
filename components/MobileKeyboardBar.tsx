// components/MobileKeyboardBar.js
import React from "react";

const MobileKeyboardBar = ({ viewPortHeight = 0, height = 50 }) => {
  return (
    <div className="mobile-keyboard-bar" style={{ top: viewPortHeight - height, height }}>
      <button>Button 1</button>
      <button>Button 2</button>
      <button>Button 3</button>
    </div>
  );
};

export default MobileKeyboardBar;
