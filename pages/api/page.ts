import invariant from "tiny-invariant";
import { query, getChildrenOfBlock } from "../../lib/api";
import { PageDb, Page, PageWithChildren } from "../../lib/model";
import { NextApiRequest, NextApiResponse } from "next";

type ErrorMsg = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PageWithChildren | ErrorMsg>
) {
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
  if (result.length !== 1) {
    return res.status(404).send({ message: "Page not found" });
  }
  const [pageDb] = result;
  const children = await getChildrenOfBlock(pageDb[":block/uid"]);
  const page: Page = result.map((page) => ({
    id: page[":db/id"],
    uid: page[":block/uid"],
    title: page[":node/title"],
    editTime: page[":edit/time"],
    createTime: page[":create/time"],
    // children: (page[":block/children"] || []).map((child) => child[":db/id"]),
    children,
  }))[0];
  // if (page.children.length !== children.length) throw new Error("Children length mismatch");
  const pageWithChildren: PageWithChildren = {
    ...page,
    children: page.children
      // .map((id) => {
      //   const child = children.find((c) => c.id === id);
      //   if (!child) throw new Error(`Could not find child ${id}`);
      //   return child;
      // })
      .sort((a, b) => a.order - b.order),
  };
  res.send(pageWithChildren);
}
