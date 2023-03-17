import Head from "next/head";
import Layout from "../components/layout";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useCallback, useEffect, useRef, useState } from "react";

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
                    [?refs :node/title "DONE"]
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
  const uid = todo.uid;

  const [checked, setChecked] = useState(false);
  const [string, setString] = useState(todo.string);
  const [editing, setEditing] = useState(false);

  // Set string and checked state from todo string
  useEffect(() => {
    if (editing) return;
    const m = todo.string.match(/^\{\{\[\[(.+)\]\]\}\}\s*/);
    if (!m) return;
    setChecked(m[1] === "DONE");
    setString(todo.string.slice(m[0].length));
  }, [todo]);

  useEffect(() => {
    trigger([uid, `{{[[${checked ? "TODO" : "DONE"}]]}} ${string}`]);
  }, [checked, string]);

  return (
    <form>
      <label>
        <input
          type="checkbox"
          checked={checked}
          // onInput={() => setChecked((checked) => !checked)}
        />
        <input
          type="text"
          value={string}
          onChange={(e) => setString(e.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
        />
      </label>
    </form>
  );
}

export default function Todos() {
  const {
    data: todos,
    error,
    isLoading,
  } = useSWR("/api/q", fetchTodos, { refreshInterval: 1000, loadingTimeout: 1000 });
  return (
    <Layout home>
      <Head>
        <title>Todos</title>
      </Head>
      <h1>Todos</h1>
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
    </Layout>
  );
}
