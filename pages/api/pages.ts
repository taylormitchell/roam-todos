import { query } from "../../lib/api";
import { Page, PageDb } from "../../lib/model";
import { NextApiRequest, NextApiResponse } from "next";
import { ApiResult, isError } from "../../lib/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResult<Page[]>>
) {
  const limit = req.body.limit || Infinity;
  const result = await query<PageDb>(`[
        :find (pull ?e [*])
        :where
            [?e :block/uid ?uid]
            [?e :node/title]
    ]`);
  if (isError(result)) {
    return res.status(500).json(result);
  }
  const pages: Page[] = result.value
    .map((page) => {
      return {
        id: page[":db/id"],
        uid: page[":block/uid"],
        title: page[":node/title"],
        children: (page[":block/children"] || []).map((child) => child[":block/uid"]),
        editTime: page[":edit/time"],
        createTime: page[":create/time"],
      };
    })
    .sort((a, b) => b.editTime - a.editTime)
    .slice(0, limit);
  return res.json({ value: pages });
}
