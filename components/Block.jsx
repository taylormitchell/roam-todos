import Head from "next/head";
import Layout from "./layout";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useCallback, useEffect, useState, useRef } from "react";
import styles from "../styles/roam.module.css";

async function updateBlock(url, { arg }) {
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

export function BlockView({ block }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { trigger } = useSWRMutation("/api/write", updateBlock);
  const ref = useRef();
  const uid = block.uid;
  const [editing, setEditing] = useState(false);

  // Set string and checked state from todo string
  useEffect(() => {
    if (editing) return;
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
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onInput={(e) => {
            updateString(e.target.innerText);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              updateString(e.target.innerText);
              e.target.blur();
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
            <BlockView key={child.uid} block={child} />
          ))}
        </ul>
      )}
    </li>
  );
}
