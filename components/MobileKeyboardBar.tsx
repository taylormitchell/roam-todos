// components/MobileKeyboardBar.js
import { useRef, useState, useEffect } from "react";
import { isMobile, showKeyboardBar } from "../lib/env";

const MobileKeyboardBar = ({
  indent,
  dedent,
  toggleTodo,
}: {
  indent: () => void;
  dedent: () => void;
  toggleTodo: () => void;
}) => {
  const height = 50;
  const [bar, setBar] = useState(null);
  useEffect(() => {
    const handleResize = () => {
      if (!bar) return;
      const show =
        (showKeyboardBar && !isMobile) ||
        window.visualViewport.height / window.screen.availHeight < 0.7;
      if (show) {
        bar.style.display = "flex";
        const top = window.visualViewport.pageTop + window.visualViewport.height - height;
        bar.style.top = `${top}px`;
      } else {
        bar.style.display = "none";
      }
    };
    handleResize();
    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);
    window.addEventListener("click", handleResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
      window.removeEventListener("click", handleResize);
    };
  }, [bar]);
  return (
    <div ref={setBar} className="mobile-keyboard-bar" style={{ height }}>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          dedent();
        }}
      >
        dedent
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          indent();
        }}
      >
        indent
      </button>
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          toggleTodo();
        }}
      >
        toggle todo
      </button>
    </div>
  );
};

export default MobileKeyboardBar;
