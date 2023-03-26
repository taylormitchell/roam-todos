import Layout from "../../../components/layout";
import { useState } from "react";
import { Block, Page, PageWithChildren } from "../../../lib/model";
import { BlockView } from "../../../components/Block";
import useSWR from "swr";
import MobileKeyboardBar from "../../../components/MobileKeyboardBar";

export const getServerSideProps = async ({ params }) => {
  return {
    props: {
      uid: params.uid,
    },
  };
};

async function fetchPage(url: string, uid: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid }),
  });
  return await res.json();
}

// @todo this is a hack
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function PageView({ uid }) {
  const {
    data: page,
    mutate,
    error,
    isLoading,
  } = useSWR<Page>(["/api/page", uid], ([url, page]) => fetchPage(url, uid), {
    refreshInterval: 5000,
    loadingTimeout: 1000,
  });
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  function indent(uid: string) {
    let sibling = null;
    const newPage = deepCopy(page); // @todo hack
    const parents: (Page | Block)[] = [newPage];
    while (sibling === null && parents.length > 0) {
      const parent = parents.shift();
      const children = parent.children;
      for (let i = 0; i < children.length; i++) {
        const current = children[i];
        if (current.uid === uid) {
          sibling = children[i - 1];
          if (sibling) {
            parent.children.splice(i, 1);
            sibling.children.push(current);
          }
          break;
        }
        if (current.children) {
          parents.push(current);
        }
      }
    }
    if (sibling) {
      mutate(newPage, { revalidate: false });
      fetch("/api/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "move-block",
          block: {
            uid,
          },
          location: {
            "parent-uid": sibling.uid,
            order: sibling.children.length,
          },
        }),
      });
    }
  }

  function dedent(uid: string) {
    mutate(
      (page: PageWithChildren) => {
        function recurse(node: Page | Block) {
          const children = [];
          for (const child of node.children) {
            if (child.uid === uid) {
              // found block to dedent
              return [node, child];
            }
            // search child for block to dedent
            const [newChild, blockToDedent] = recurse(child);
            if (blockToDedent === null) {
              children.push(newChild);
            } else {
              // At this point, we have found the block to dedent and its
              // parent. We need to remove the block from the parent's children
              // and add it to the grandparent's children.
              let grandparent = node;
              let parent = child;
              const newParent = {
                ...parent,
                children: parent.children.filter((child) => child.uid !== blockToDedent.uid),
              };
              const parentIndex = grandparent.children.findIndex(
                (child) => child.uid === parent.uid
              );
              grandparent = {
                ...grandparent,
                children: [
                  ...grandparent.children.slice(0, parentIndex),
                  newParent,
                  blockToDedent,
                  ...grandparent.children.slice(parentIndex + 1),
                ],
              };
              return [grandparent, null];
            }
          }
          return [
            {
              ...node,
              children,
            },
            null,
          ];
        }
        const [newPage] = recurse(page);
        return newPage;
      },
      { revalidate: false }
    );
  }

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
            <BlockView
              key={child.uid}
              block={child}
              indent={indent}
              dedent={dedent}
              setActiveBlock={setActiveBlock}
            />
          ))}
        </ul>
      )}
      <MobileKeyboardBar
        indent={() => {
          if (activeBlock !== null) {
            console.log("indent");
            indent(activeBlock);
          }
        }}
        dedent={() => {
          if (activeBlock !== null) {
            console.log("dedent");
            dedent(activeBlock);
          }
        }}
      />
    </Layout>
  );
}
