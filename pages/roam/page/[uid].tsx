import Layout from "../../../components/layout";
import { useState } from "react";
import { Block, Page } from "../../../lib/model";
import { BlockView } from "../../../components/Block";
import useSWR, { useSWRConfig } from "swr";
import MobileKeyboardBar from "../../../components/MobileKeyboardBar";
import Link from "next/link";

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
  if (!res.ok) throw new Error(res.statusText);
  return await res.json();
}

// @todo this is a hack
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function toggleTodoString(str: string) {
  if (str.startsWith("{{[[TODO]]}}")) {
    return str.replace("{{[[TODO]]}}", "{{[[DONE]]}}");
  } else if (str.startsWith("{{[[DONE]]}}")) {
    return str.replace("{{[[DONE]]}}", "");
  } else {
    return "{{[[TODO]]}}" + (str[0] !== " " ? " " : "") + str;
  }
}

export default function PageView({ uid }) {
  const {
    data: page,
    mutate: mutatePage,
    error,
    isLoading,
  } = useSWR<Page>(["/api/page", uid], ([url, page]) => fetchPage(url, uid), {
    refreshInterval: 30_000,
    loadingTimeout: 1000,
  });
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  // const [activeBlock, setActiveBlock] = useState<HTMLDivElement>();

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
      mutatePage(newPage, { revalidate: false });
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
    let newParentUid = null;
    let newOrder = null;
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
          // @todo this is pretty messy
          let grandparent = node;
          let parent = child;
          parent = {
            ...parent,
            children: parent.children.filter((child) => child.uid !== blockToDedent.uid),
          };
          const parentIndex = grandparent.children.findIndex((child) => child.uid === parent.uid);
          grandparent = {
            ...grandparent,
            children: [
              ...grandparent.children.slice(0, parentIndex),
              parent,
              blockToDedent,
              ...grandparent.children.slice(parentIndex + 1),
            ],
          };
          newParentUid = grandparent.uid;
          newOrder = parentIndex + 1;
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
    if (newParentUid !== null && newOrder !== null) {
      mutatePage(newPage, { revalidate: false });
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
            "parent-uid": newParentUid,
            order: newOrder,
          },
        }),
      });
    }
  }

  // @todo this is super slow cause cache isn't updated until after
  // revalidation happens
  function createBelow(uid: string) {
    const newPage = deepCopy(page); // @todo hack
    const parents: (Page | Block)[] = [newPage];
    while (parents.length > 0) {
      const parent = parents.shift();
      const children = parent.children;
      for (let i = 0; i < children.length; i++) {
        const current = children[i];
        if (current.uid === uid) {
          // const newBlock = {
          //   string: "",
          //   children: []
          // };
          // parent.children.splice(i + 1, 0, newBlock);
          // mutatePage(newPage, { revalidate: false });
          fetch("/api/write", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "create-block",
              block: { string: "" },
              location: {
                "parent-uid": parent.uid,
                order: i + 1,
              },
            }),
          }).then(() => mutatePage());
          return;
        }
        if (current.children) {
          parents.push(current);
        }
      }
    }
  }

  function updateString(uid: string, string: string) {
    const newPage = deepCopy(page); // @todo hack
    const q: Block[] = [...newPage.children];
    while (q.length > 0) {
      const b = q.shift();
      if (b.uid === uid) {
        b.string = string;
        break;
      }
      q.push(...b.children);
    }
    mutatePage(newPage, { revalidate: false });
    fetch("/api/write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "update-block",
        block: {
          uid,
          string,
        },
      }),
    });
  }

  function toggleTodo(uid: string, el: HTMLSpanElement) {
    const newString = toggleTodoString(el.innerText);
    el.innerText = newString;
    updateString(uid, newString);
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Failed to load</p>;
  }
  return (
    <Layout>
      <Link href="/roam">Back</Link>
      <h2>{page.title}</h2>
      {page.children && (
        <div>
          <ul>
            {page.children.map((child) => (
              <BlockView
                key={child.uid}
                block={child}
                indent={indent}
                dedent={dedent}
                createBelow={createBelow}
                setActiveBlock={setActiveBlock}
                updateString={updateString}
              />
            ))}
          </ul>
          <div style={{ height: "500px", width: "100%" }} />
        </div>
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
        toggleTodo={() => {
          if (activeBlock !== null) {
            const el = document.querySelector(
              `div[data-uid="${activeBlock}"] span`
            ) as HTMLSpanElement;
            if (el) toggleTodo(activeBlock, el);
          }
        }}
      />
    </Layout>
  );
}
