import { useEffect, useState, useRef, useCallback } from "react";
import styles from "../styles/roam.module.css";
import { Block } from "../lib/model";
import { debounce } from "lodash";

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

function toggleTodoString(str: string) {
  if (str.startsWith("{{[[TODO]]}}")) {
    return str.replace("{{[[TODO]]}}", "{{[[DONE]]}}");
  } else if (str.startsWith("{{[[DONE]]}}")) {
    return str.replace("{{[[DONE]]}}", "");
  } else {
    return "{{[[TODO]]}}" + (str[0] !== " " ? " " : "") + str;
  }
}

export function BlockView({
  block,
  indent,
  dedent,
  setActiveBlock,
  createBelow,
  updateBlockString,
  toggleBlockOpen,
  isActiveBlock,
}: {
  block: Block;
  indent: (uid: string) => void;
  dedent: (uid: string) => void;
  setActiveBlock: (uid: string) => void;
  createBelow: (uid: string) => void;
  updateBlockString: (uid: string, string: string) => void;
  toggleBlockOpen: (uid: string) => void;
  isActiveBlock: (uid: string) => boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const uid = block.uid;
  const isActive = isActiveBlock(uid);
  function setActive(bool: boolean) {
    setActiveBlock(uid);
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

  const buttonClass = styles.toggle + " " + (block.open ? styles.expanded : "");
  return (
    <li>
      <div className={styles.block} data-uid={uid}>
        <div className="bullet-container">
          <div className="bullet" />
        </div>
        <span
          // className={style["todo-string"]}
          ref={ref}
          contentEditable
          onFocus={() => setActive(true)}
          onBlur={() => {
            if (isActive) setActive(false);
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
            }
          }}
        ></span>
        <div className={styles["toggle-container"]}>
          {block.children.length > 0 && (
            <button className={buttonClass} onClick={() => toggleBlockOpen(uid)} />
          )}
        </div>
      </div>
      {block.children && block.open && (
        <ul className="block-children">
          {block.children.map((child) => (
            <BlockView
              key={child.uid}
              block={child}
              indent={indent}
              dedent={dedent}
              setActiveBlock={setActiveBlock}
              createBelow={createBelow}
              updateBlockString={updateBlockString}
              toggleBlockOpen={toggleBlockOpen}
              isActiveBlock={isActiveBlock}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
