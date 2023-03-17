import invariant from "tiny-invariant";

const token = process.env.ROAM_TOKEN;
invariant(token !== undefined, "ROAM_TOKEN is not set");

export default async function handler(req, res) {
  const query = req.body.query;
  if (!query) {
    return res.status(400).json({ message: "Query is required" });
  }
  const args = req.body.args || [];
  try {
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
    return res.json(data.result);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}
