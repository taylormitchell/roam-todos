import invariant from "tiny-invariant";
import { NextApiRequest, NextApiResponse } from "next";

const token = process.env.ROAM_TOKEN;
invariant(token !== undefined, "ROAM_TOKEN is not set");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const body = req.body || {};
  if (!body.action) {
    return res.status(400).json({ message: "Action is required" });
  }
  try {
    await fetch(`https://api.roamresearch.com/api/graph/second_brain/write`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.json({ success: true });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
}
