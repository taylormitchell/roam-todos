import Layout from "../../../components/layout";
import { useEffect, useState } from "react";
import { Block, PageWithChildren } from "../../../lib/model";
import { BlockView } from "../../../components/Block";
import styles from "../../../styles/roam.module.css";
import useSWR from "swr";

export const getServerSideProps = async ({ params }) => {
  return {
    props: {
      uid: params.uid,
    },
  };
};

async function fetchPage(url, uid) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid }),
  });
  return await res.json();
}

export default function Page({ uid }) {
  // const [loading, setLoading] = useState(true);
  const {
    data: page,
    error,
    isLoading,
  } = useSWR(["/api/page", uid], ([url, page]) => fetchPage(url, uid), {
    refreshInterval: 5000,
    loadingTimeout: 1000,
  });
  // const [page, setPage] = useState<PageWithChildren | null>(null);
  // useEffect(() => {
  //   fetch("/api/page", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ uid }),
  //   })
  //     .then((res) => res.json() as Promise<PageWithChildren>)
  //     .then((data) => {
  //       setPage(data);
  //       setLoading(false);
  //     });
  // }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Failed to load: {error}</p>;
  }
  return (
    <Layout>
      <h2>{page.title}</h2>
      {page.children && (
        <ul>
          {page.children.map((child) => (
            <BlockView key={child.uid} block={child} />
          ))}
        </ul>
      )}
    </Layout>
  );
}
