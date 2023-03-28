import Layout from "../components/layout";
import Link from "next/link";
import { useState } from "react";
import { Page } from "../lib/model";
import { ApiResult, isError } from "../lib/types";
import useSWR from "swr";

async function fetchPages(url: string): Promise<Page[]> {
  const res = await fetch(url);
  const data: ApiResult<Page[]> = await res.json();
  if (isError(data)) {
    throw new Error(data.error);
  }
  return data.value;
}

export default function Roam() {
  const [search, setSearch] = useState("");
  const { data: pages, error, isLoading } = useSWR<Page[], Error>("/api/pages", fetchPages);

  if (error) return <div>Failed to load: {error.message}</div>;
  return (
    <Layout>
      <h2>Roam</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
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
        </>
      )}
    </Layout>
  );
}
