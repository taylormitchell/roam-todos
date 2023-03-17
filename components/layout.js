import Head from "next/head";
import Image from "next/image";
import styles from "./layout.module.css";
import utilStyles from "../styles/utils.module.css";
import Link from "next/link";

const name = "Taylor Mitchell";
export const siteTitle = "Roam Todo";

export default function Layout({ children, home }) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Roam todo app" />
        <meta name="og:title" content={siteTitle} />
      </Head>
      <main>{children}</main>
    </div>
  );
}
