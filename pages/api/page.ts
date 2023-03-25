import invariant from "tiny-invariant";
import { query, getChildrenOfBlock } from "../../lib/api";
import { PageDb, Page, PageWithChildren } from "../../lib/model";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse<PageWithChildren>) {
  const uid = req.body.uid;
  if (!uid) {
    return res.status(400);
  }
  const result = await query<PageDb>(`[
    :find (pull ?e [*])
    :where
        [?e :block/uid "${uid}"]
        [?e :node/title]
    ]`);
  invariant(result.length === 1, "Expected 1 result");
  const page: Page = result.map((page) => ({
    id: page[":db/id"],
    uid: page[":block/uid"],
    title: page[":node/title"],
    children: (page[":block/children"] || []).map((child) => child[":db/id"]),
    editTime: page[":edit/time"],
    createTime: page[":create/time"],
  }))[0];
  console.log(page);
  const children = await getChildrenOfBlock(page.uid);
  console.log(children);
  if (page.children.length !== children.length) throw new Error("Children length mismatch");
  const pageWithChildren: PageWithChildren = {
    ...page,
    children: page.children
      .map((id) => {
        const child = children.find((c) => c.id === id);
        if (!child) throw new Error(`Could not find child ${id}`);
        return child;
      })
      .sort((a, b) => a.order - b.order),
  };
  res.send(pageWithChildren);
}
