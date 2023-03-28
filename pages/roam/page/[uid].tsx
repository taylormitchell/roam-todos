import Layout from "../../../components/layout";
import { useState } from "react";
import { Block, Page, PageWithChildren } from "../../../lib/model";
import { BlockView } from "../../../components/Block";
import useSWR from "swr";
import MobileKeyboardBar from "../../../components/MobileKeyboardBar";
import Link from "next/link";
import { ApiResult, isError } from "../../../lib/types";

export const getServerSideProps = async ({ params }) => {
  return {
    props: {
      uid: params.uid,
    },
  };
};

async function fetchPage(url: string, uid: string): Promise<PageWithChildren> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uid }),
  });
  const data: ApiResult<PageWithChildren> = await res.json();
  if (isError(data)) {
    throw new Error(data.error);
  } else {
    return data.value;
  }
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

function updateBlockInPage(page: Page, uid: string, update: (b: Block) => Block) {
  return {
    ...page,
    children: page.children.map((child) => updateBlockInTree(child as Block, uid, update)),
  };
}

function updateBlockInTree(block: Block, uid: string, update: (b: Block) => Block) {
  if (block.uid === uid) {
    return update(block);
  }
  if (block.children) {
    return {
      ...block,
      children: block.children.map((child) => updateBlockInTree(child as Block, uid, update)),
    };
  }
  return block;
}

export default function PageView({ uid }) {
  const {
    data: page,
    mutate: mutatePage,
    error,
    isLoading,
  } = useSWR<Page, Error>(["/api/page", uid], ([url, page]) => fetchPage(url, uid), {
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
            sibling.open = true;
          }
          break;
        }
        if (current.children) {
          parents.push(current);
        }
      }
    }
    if (sibling) {
      // Move block under sibling
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
      // Open sibling
      fetch("/api/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-block",
          block: {
            uid,
            open: true,
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

  const updateBlockString = (uid: string, string: string) => {
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
  };

  function toggleBlockOpen(uid: string) {
    let newOpen = false;
    const newPage = updateBlockInPage(page, uid, (block) => {
      newOpen = !block.open;
      return {
        ...block,
        open: newOpen,
      };
    });
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
          open: newOpen,
        },
      }),
    });
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (error) {
    return <p>Error loading page: {error.message}</p>;
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
                updateBlockString={updateBlockString}
                toggleBlockOpen={toggleBlockOpen}
                isActiveBlock={(uid: string) => activeBlock === uid}
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
            if (!el) return;
            const string = toggleTodoString(el.innerText);
            el.innerText = string;
            // @todo I ideally we wouldn't need this call cause any change
            // to the element would trigger an update from inside the block
            // component
            updateBlockString(activeBlock, string);
          }
        }}
      />
    </Layout>
  );
}
