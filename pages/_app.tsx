import Head from "next/head";
import { useEffect, useState } from "react";
import MobileKeyboardBar from "../components/MobileKeyboardBar";
import "../components/MobileKeyboardBar.css";

function App({ Component, pageProps }) {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);
  const [keyboardFromTop, setKeyboardFromTop] = useState(0);
  const handleResize = () => {
    setIsKeyboardOpen(window.visualViewport.height / window.screen.availHeight < 0.7);
    setKeyboardFromTop(window.visualViewport.pageTop + window.visualViewport.height);
  };
  useEffect(() => {
    const update = () => requestAnimationFrame(handleResize);
    window.visualViewport.addEventListener("resize", update);
    window.visualViewport.addEventListener("scroll", update);
    return () => {
      window.visualViewport.removeEventListener("resize", update);
      window.visualViewport.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Component {...pageProps} />
      {JSON.stringify({ isKeyboardOpen, keyboardFromTop })}
      {isKeyboardOpen && <MobileKeyboardBar viewPortHeight={keyboardFromTop} />}
    </>
  );
}

export default App;
