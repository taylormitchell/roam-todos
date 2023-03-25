import Layout from "../components/layout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Page } from "../lib/model";

export default function Roam() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<Page[]>([]);
  useEffect(() => {
    fetch("/api/pages")
      .then((res) => res.json() as Promise<Page[]>)
      .then((data) => {
        setPages(data);
        setLoading(false);
      });
  }, []);

  return (
    <Layout>
      <h2>Roam</h2>
      {loading && <p>Loading...</p>}
      <input type="text" onChange={(e) => setSearch(e.target.value.toLocaleLowerCase())} />
      <ul>
        {pages
          .filter((page) => page.title.toLocaleLowerCase().includes(search))
          .slice(0, 10)
          .map((page) => (
            <li key={page.title}>
              <Link href={`/roam/page/${page.uid}`}>{page.title}</Link>
            </li>
          ))}
      </ul>
    </Layout>
  );
}
