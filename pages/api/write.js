import invariant from "tiny-invariant";

const token = process.env.ROAM_TOKEN;
invariant(token !== undefined, "ROAM_TOKEN is not set");

export default async function handler(req, res) {
  const { action, block } = req.body;
  if (!action) {
    return res.status(400).json({ message: "Action is required" });
  }
  if (!block) {
    return res.status(400).json({ message: "Block is required" });
  }
  try {
    await fetch(`https://api.roamresearch.com/api/graph/second_brain/write`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action,
        block,
      }),
    });
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}
