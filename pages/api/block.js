import { query } from "../../lib/api";

export default async function handler(req, res) {
  const uid = req.body.uid;
  const fill = req.body.includeChildren || false;
  if (!uid) {
    return res.status(400).json({ message: "uid is required" });
  }
  const result = await query(`[
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
  if (fill) {
    const children = await getChildrenOfBlock(block.uid);
    if (block.children.length !== children.length) throw new Error("Children length mismatch");
    block.children = block.children
      .map((uid) => {
        const child = children.find((c) => c.uid === uid);
        if (!child) throw new Error(`Could not find child ${uid}`);
        return child;
      })
      .sort((a, b) => a.order - b.order);
  }
  return block;
}
