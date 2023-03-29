import Head from "next/head";
import { useRouter } from "next/router";
import "../components/MobileKeyboardBar.css";
import "../styles/globals.css";

function App({ Component, pageProps }) {
  const router = useRouter();
  return (
    <div id="app">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <header>
        <button onClick={() => router.back()}>Back</button>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
      <footer>
        <button onClick={() => router.push("/")}>Home</button>
        <button onClick={() => router.push("/roam")}>Search</button>
      </footer>
    </div>
  );
}

export default App;
