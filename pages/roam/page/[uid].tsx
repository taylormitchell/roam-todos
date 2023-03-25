import Layout from "../../../components/layout";
import { useEffect, useState } from "react";
import { Block, PageWithChildren } from "../../../lib/model";

function renderChildren(children: Block[]) {
  return (
    <ul>
      {children.map((child) => (
        <li key={child.uid}>
          <div className="block">{child.string}</div>
          {child.children && renderChildren(child.children)}
        </li>
      ))}
    </ul>
  );
}

export const getServerSideProps = async ({ params }) => {
  return {
    props: {
      uid: params.uid,
    },
  };
};

export default function Page({ uid }) {
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageWithChildren | null>(null);
  useEffect(() => {
    fetch("/api/page", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uid }),
    })
      .then((res) => res.json() as Promise<PageWithChildren>)
      .then((data) => {
        setPage(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }
  return (
    <Layout>
      <h2>{page.title}</h2>
      <ul>{page.children && renderChildren(page.children)}</ul>
    </Layout>
  );
}
