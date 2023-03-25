import { query } from "../../lib/api";
import { Page, PageDb } from "../../lib/model";

export default async function handler(req, res) {
  const limit = req.body.limit || Infinity;
  const result = await query<PageDb>(`[
        :find (pull ?e [*])
        :where
            [?e :block/uid ?uid]
            [?e :node/title]
    ]`);
  const pages: Page[] = result
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
  res.send(pages);
}
