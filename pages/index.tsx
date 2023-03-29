import Head from "next/head";
import Layout, { siteTitle } from "../components/layout";
import Link from "next/link";
import { getDateString } from "../lib/date";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const today = getDateString(0, "mm-dd-yyyy");
  const tomorrow = getDateString(1, "mm-dd-yyyy");
  return (
    <Layout>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <h2>Date</h2>
      <ul>
        <li>
          <Link href={`/roam/page/${today}`}>Today</Link>
        </li>
        <li>
          <Link href={`/roam/page/${tomorrow}`}>Tomorrow</Link>
        </li>
        <li>
          <input
            type="date"
            id="date"
            name="date"
            placeholder="select date..."
            onChange={(e) => {
              const date = e.target.value;
              const [y, m, d] = date.split("-");
              router.push(`/roam/page/${m}-${d}-${y}`);
            }}
          ></input>
        </li>
      </ul>
      <h2>Projects</h2>
      <ul>
        <li>
          <Link href="/roam/page/90ButuiC2">Ideaflow</Link>
        </li>
      </ul>
    </Layout>
  );
}
