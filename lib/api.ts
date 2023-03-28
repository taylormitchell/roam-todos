import invariant from "tiny-invariant";
import { BlockDb, BlockWithChildren, Block } from "./model";
import { ApiResult, isError } from "./types";

const token = process.env.ROAM_TOKEN;
invariant(token !== undefined, "ROAM_TOKEN is not set");

export function createTree(blocks: BlockDb[]): BlockWithChildren[] {
  const isChild: Set<number> = new Set();
  const blockMap: Map<number, { block: Block; childrenIds: number[] }> = new Map();
  blocks.forEach((block) => {
    blockMap.set(block[":db/id"], {
      block: {
        id: block[":db/id"],
        uid: block[":block/uid"],
        string: block[":block/string"],
        order: block[":block/order"],
        page: block[":block/page"],
        children: [],
        editTime: block[":edit/time"],
        createTime: block[":create/time"],
      },
      childrenIds: (block[":block/children"] || []).map((child) => child[":db/id"]),
    });
  });
  blockMap.forEach(({ block, childrenIds }) => {
    block.children = childrenIds
      .map((id) => {
        isChild.add(id);
        return blockMap.get(id).block;
      })
      .sort((a, b) => a.order - b.order);
  });
  const roots = Array.from(blockMap.values())
    .map(({ block }) => block)
    .filter((block) => !isChild.has(block.id));
  return roots;
}

export async function query<T = any>(query: string, args = []): Promise<ApiResult<T[]>> {
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
  if (!r.ok) {
    return { error: data.message || `${r.status} ${r.statusText}` };
  }
  return { value: data.result.map((row: any[]) => row[0]) as T[] };
}

export async function getChildrenOfBlock(uid: string): Promise<ApiResult<BlockWithChildren[]>> {
  const result = await query<BlockDb>(`[
      :find (pull ?e [*])
      :where
          [?e :block/uid ?uid]
          [?e :block/string ?str]
          [?e :block/parents ?parent]
          [?parent :block/uid "${uid}"]
      ]`);
  if (isError(result)) {
    return { error: result.error };
  }
  const children = createTree(result.value).sort((a, b) => a.order - b.order);
  return { value: children };
}
