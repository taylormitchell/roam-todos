import fetch from "node-fetch";

const token = "roam-graph-token-sk1yn-8ZXiM369nF14V9heS15fo5n";

function createTree(blocks) {
  const isChild = new Set();
  const blockMap = {};
  blocks.forEach((block) => (blockMap[block.uid] = block));
  blocks.forEach((block) => {
    block.children = block.children
      .map((uid) => {
        isChild.add(uid);
        return blockMap[uid];
      })
      .sort((a, b) => a.order - b.order);
  });
  const roots = blocks.filter((block) => !isChild.has(block.uid));
  return roots;
}

async function query(query, args = []) {
  const r = await fetch(`https://api.roamresearch.com/api/graph/second_brain/q`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      args,
    }),
  });
  const data = await r.json();
  return data.result;
}

async function getChildrenOfBlock(uid) {
  const result = query(`[
    :find (pull ?e [:block/uid :block/string :block/order :block/page :block/parents {:block/children [:block/uid]}])
    :where
        [?e :block/uid ?uid]
        [?e :block/string ?str]
        [?e :block/parents ?parent]
        [?parent :block/uid "${uid}"]
    ]`);
  const blocks = result.map((row) => {
    const [block] = row;
    return {
      uid: block[":block/uid"],
      string: block[":block/string"],
      order: block[":block/order"],
      page: block[":block/page"],
      parents: block[":block/parents"],
      children: (block[":block/children"] || []).map((child) => child[":block/uid"]),
    };
  });
  const children = createTree(blocks).sort((a, b) => a.order - b.order);
  return children;
}

async function getBlockAndChildren(uid) {
  const result = query(`[
    :find (pull ?e [:block/uid :block/string :block/order :block/page :block/parents {:block/children [:block/uid]}])
    :where
        [?e :block/uid "${uid}"]
    ]`);
  const [block] = result.map((row) => {
    const [block] = row;
    return {
      uid: block[":block/uid"],
      string: block[":block/string"],
      order: block[":block/order"],
      page: block[":block/page"],
      parents: block[":block/parents"],
      children: (block[":block/children"] || []).map((child) => child[":block/uid"]),
    };
  });
  const children = await getChildrenOfBlock(block.uid);
  if (block.children.length !== children.length) throw new Error("Children length mismatch");
  block.children = block.children
    .map((uid) => {
      const child = children.find((c) => c.uid === uid);
      if (!child) throw new Error(`Could not find child ${uid}`);
      return child;
    })
    .sort((a, b) => a.order - b.order);
  return block;
}

async function getPageAndChildren(title) {
  const result = await query(`[
    :find (pull ?e [:block/uid :node/title {:block/children [:block/uid]}])
    :where
        [?e :block/uid ?uid]
        [?e :node/title "${title}"]
    ]`);
  const [page] = result.map((row) => {
    const [page] = row;
    return {
      uid: page[":block/uid"],
      title: page[":node/title"],
      children: (page[":block/children"] || []).map((child) => child[":block/uid"]),
    };
  });
  const children = await getChildrenOfBlock(page.uid);
  if (page.children.length !== children.length) throw new Error("Children length mismatch");
  page.children = page.children
    .map((uid) => {
      const child = children.find((c) => c.uid === uid);
      if (!child) throw new Error(`Could not find child ${uid}`);
      return child;
    })
    .sort((a, b) => a.order - b.order);
  return page;
}

async function getPages(limit = 10) {
  // Get pages ordered by
  const result = await query(`[
    :find (pull ?e [:block/uid :node/title {:block/children [:block/uid]}])
    :where
        [?e :block/uid ?uid]
        [?e :node/title ?title]
    :limit ${limit}
    ]`);
  const pages = result.map((row) => {
    const [page] = row;
    return {
      uid: page[":block/uid"],
      title: page[":node/title"],
      children: (page[":block/children"] || []).map((child) => child[":block/uid"]),
    };
  });
  return pages;
}

async function test(title) {
  const result = await query(`[
    :find (pull ?e [* {:block/children [:block/uid]}])
    :where
        [?e :block/uid ?uid]
        [?e :node/title "${title}"]
    ]`);
  console.log(result);
}

test("roam-todo");
