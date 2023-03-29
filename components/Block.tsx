import { useEffect, useRef, useCallback, useContext } from "react";
import styles from "../styles/roam.module.css";
import { Block } from "../lib/model";
import { debounce } from "lodash";
import BlockContext from "./BlockContext";

export async function updateBlock(url: string, { arg }) {
  const [uid, string] = arg;
  const res = await fetch(url, {
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
  return res.json();
}

export function toggleTodoString(str: string) {
  if (str.startsWith("{{[[TODO]]}}")) {
    return str.replace("{{[[TODO]]}}", "{{[[DONE]]}}");
  } else if (str.startsWith("{{[[DONE]]}}")) {
    return str.replace("{{[[DONE]]}}", "");
  } else {
    return "{{[[TODO]]}}" + (str[0] !== " " ? " " : "") + str;
  }
}

// @todo this is a bit of a mess
function BlockContent({ uid, string }: { uid: string; string: string }) {
  const { setActiveBlock, updateBlockString } = useContext(BlockContext);
  const todoMatch = string.match(/^{{\[\[(TODO|DONE)\]\]}}/);
  const checked = todoMatch && todoMatch[1] === "DONE";
  function flipTodo() {
    if (!todoMatch) return;
    if (checked) {
      updateBlockString(uid, string.replace("{{[[DONE]]}}", "{{[[TODO]]}}"));
    } else {
      updateBlockString(uid, string.replace("{{[[TODO]]}}", "{{[[DONE]]}}"));
    }
  }
  if (todoMatch) {
    return (
      <span>
        <input type="checkbox" checked={checked} onChange={flipTodo} />
        <span onClick={() => setActiveBlock(uid)}>{string.slice(todoMatch[0].length)}</span>
      </span>
    );
  } else {
    return <span onClick={() => setActiveBlock(uid)}>{string}</span>;
  }
}

export function BlockView({ block }: { block: Block }) {
  const {
    indent,
    dedent,
    createBelow,
    updateBlockString,
    deleteBlock,
    toggleBlockOpen,
    isActiveBlock,
    setActiveBlock,
  } = useContext(BlockContext);

  const ref = useRef<HTMLSpanElement>(null);
  const uid = block.uid;
  const isActive = isActiveBlock(uid);
  function setActive(bool: boolean) {
    setActiveBlock(bool ? uid : null);
  }

  const updateString = useCallback(
    // @todo I really just want to debounce the api calls, not the cache updates
    debounce((string) => {
      updateBlockString(block.uid, string);
    }, 2000),
    [block.uid, updateBlockString]
  );
  const toggleTodo = useCallback(
    (el: HTMLSpanElement) => {
      const string = toggleTodoString(el.innerText);
      el.innerText = string;
      updateString(string);
    },
    [updateString]
  );

  // Set string and checked state from todo string
  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerText = block.string;
      if (isActive) {
        ref.current.focus();
      }
    }
  }, [block.string, isActive]);

  console.log({ block, isActive });
  const buttonClass = styles.toggle + " " + (block.open ? styles.expanded : "");
  return (
    <li>
      <div className={styles.block} data-uid={uid}>
        <div className="bullet-container">
          <div className="bullet" />
        </div>
        {isActive ? (
          <span
            // className={style["todo-string"]}
            ref={ref}
            contentEditable
            onBlur={() => {
              if (isActive) {
                setActive(false);
              }
            }}
            onInput={(e) => {
              updateString(e.currentTarget.innerText);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (e.metaKey) {
                  toggleTodo(e.currentTarget);
                } else {
                  createBelow(block.uid);
                }
              } else if (e.key === "Tab") {
                e.preventDefault();
                if (e.shiftKey) {
                  dedent(block.uid);
                } else {
                  indent(block.uid);
                }
              } else if (e.key === "Backspace" && e.currentTarget.innerText.match(/^\s*$/)) {
                e.preventDefault();
                deleteBlock(block.uid);
              }
            }}
          ></span>
        ) : (
          <BlockContent uid={block.uid} string={block.string} />
        )}
        <div className={styles["toggle-container"]}>
          {block.children.length > 0 && (
            <button className={buttonClass} onClick={() => toggleBlockOpen(uid)} />
          )}
        </div>
      </div>
      {block.children && block.open && (
        <ul className="block-children">
          {block.children.map((child) => (
            <BlockView key={child.uid} block={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
