import { query, getChildrenOfBlock } from "../../lib/api";
import { PageDb, Page, PageWithChildren } from "../../lib/model";
import { ApiResult, isError } from "../../lib/types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResult<PageWithChildren>>
) {
  const uid = req.body.uid;
  if (!uid) {
    return res.status(400);
  }
  try {
    const result = await query<PageDb>(`[
      :find (pull ?e [*])
      :where
          [?e :block/uid "${uid}"]
          [?e :node/title]
      ]`);
    if (isError(result)) {
      return res.status(500).json(result);
    }
    const pagesDb = result.value;
    if (pagesDb.length !== 1) {
      return res.status(404).json({ error: "Page not found" });
    }
    const [pageDb] = pagesDb;
    const resChildren = await getChildrenOfBlock(pageDb[":block/uid"]);
    if (isError(resChildren)) {
      return res.status(500).json({ error: `Error getting children: ${resChildren.error}` });
    }
    const page: Page = {
      id: pageDb[":db/id"],
      uid: pageDb[":block/uid"],
      title: pageDb[":node/title"],
      editTime: pageDb[":edit/time"],
      createTime: pageDb[":create/time"],
      // children: (page[":block/children"] || []).map((child) => child[":db/id"]),
      children: resChildren.value,
    };
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
    res.json({ value: pageWithChildren });
    // res.json({ value: pageWithChildren });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
    // res.status(500).json({ error: error.message });
  }
}
