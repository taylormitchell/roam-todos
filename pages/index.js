import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <h1>Todo lists</h1>
      <ul>
        <li>
          <Link href="/todos">Todos</Link>
        </li>
      </ul>
    </Layout>
  );
}
