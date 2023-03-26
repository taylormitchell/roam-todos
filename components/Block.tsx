import useSWRMutation from "swr/mutation";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/roam.module.css";
import { Block } from "../lib/model";

async function updateBlock(url: string, { arg }) {
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

export function BlockView({
  block,
  indent,
  dedent,
  setActiveBlock,
}: {
  block: Block;
  indent: (uid: string) => void;
  dedent: (uid: string) => void;
  setActiveBlock: (uid: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { trigger } = useSWRMutation("/api/write", updateBlock);
  const ref = useRef<HTMLSpanElement>(null);
  const uid = block.uid;
  const [isActive, _setActive] = useState(false);
  function setActive(bool: boolean) {
    _setActive(bool);
    setActiveBlock(uid);
  }

  // Set string and checked state from todo string
  useEffect(() => {
    if (isActive) return;
    if (!ref.current) return;
    ref.current.innerText = block.string;
  }, [block]);

  function updateString(str) {
    trigger([uid, str]);
  }

  const buttonClass = styles.toggle + " " + (isExpanded ? styles.expanded : "");
  return (
    <li>
      <div className={styles.block}>
        <span
          // className={style["todo-string"]}
          ref={ref}
          contentEditable
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onInput={(e) => {
            updateString(e.currentTarget.innerText);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              updateString(e.currentTarget.innerText);
              e.currentTarget.blur();
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
        {block.children.length > 0 && (
          <button className={buttonClass} onClick={() => setIsExpanded(!isExpanded)} />
        )}
      </div>
      {block.children && isExpanded && (
        <ul>
          {block.children.map((child) => (
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
    </li>
  );
}