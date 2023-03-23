import Head from "next/head";
import Layout from "./layout";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useCallback, useEffect, useState, useRef } from "react";
import style from "./todos.module.css";

async function fetchTodos(url, page = "roam-todo") {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `[
            :find ?uid ?str ?order
            :where
                [?e :block/uid ?uid]
                [?e :block/string ?str]
                [?e :block/order ?order]
                [?e :block/page ?page]
                [?e :block/refs ?refs]
                [?page :node/title "${page}"]
                (or
                    [?refs :node/title "TODO"]
                )
        ]`,
    }),
  });
  const data = await res.json();
  return data.map((arr) => ({ uid: arr[0], string: arr[1], order: arr[2] }));
}

async function updateTodo(url, { arg }) {
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

function Todo({ todo }) {
  const { trigger } = useSWRMutation("/api/write", updateTodo);
  const ref = useRef();
  const uid = todo.uid;

  const [checked, setChecked] = useState(false);
  const [editing, setEditing] = useState(false);

  // Set string and checked state from todo string
  useEffect(() => {
    if (editing) return;
    const m = todo.string.match(/^\{\{\[\[(.+)\]\]\}\}\s*/);
    if (!m) return;
    setChecked(m[1] === "DONE");
    ref.current.innerText = todo.string.slice(m[0].length);
  }, [todo]);

  const toggle = useCallback(() => {
    if (!ref.current) return;
    setChecked((checked) => !checked);
    trigger([uid, `{{[[${checked ? "TODO" : "DONE"}]]}} ${ref.current.innerText}`]);
  }, [checked, ref.current]);

  const updateString = useCallback(
    (newString) => {
      trigger([uid, `{{[[${checked ? "DONE" : "TODO"}]]}} ${newString}`]);
    },
    [checked]
  );

  return (
    <>
      <input type="checkbox" checked={checked} onChange={toggle} />
      <span
        className={style["todo-string"]}
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
    </>
  );
}

export default function Todos({ page }) {
  const {
    data: todos,
    error,
    isLoading,
  } = useSWR(["/api/q", page], ([url, page]) => fetchTodos(url, page), {
    refreshInterval: 5000,
    loadingTimeout: 1000,
  });

  return (
    <>
      <ul>
        {isLoading && <li>Loading...</li>}
        {error && <li>Error: {error.message}</li>}
        {todos &&
          todos
            .sort((a, b) => a.order - b.order)
            .map((todo) => (
              <li key={todo.uid}>
                <Todo todo={todo} />
              </li>
            ))}
      </ul>
    </>
  );
}
