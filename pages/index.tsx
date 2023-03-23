import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import Link from "next/link";
import { getDateString } from "../lib/date";

export default function Home() {
  const today = getDateString();
  const tomorrow = getDateString(1);
  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <h2>Date</h2>
      <ul>
        <li>
          <Link href={`/date/${today}`}>Today</Link>
        </li>
        <li>
          <Link href={`/date/${tomorrow}`}>Tomorrow</Link>
        </li>
        <li>
          <Link href="/date/upcoming">Upcoming</Link>
        </li>
      </ul>
      <h2>Projects</h2>
      <ul>
        <li>Ideaflow</li>
        <li>Personal work</li>
      </ul>
    </Layout>
  );
}
