import Head from "next/head";
import "../components/MobileKeyboardBar.css";
import "../styles/globals.css";

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          overflowY: "scroll",
        }}
      >
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default App;
