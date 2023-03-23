// redirect to today's date

import { useRouter } from "next/router";
import { useEffect } from "react";
import { getDateString } from "../lib/date";

export default function Date() {
  const router = useRouter();
  useEffect(() => {
    router.push("/date/" + getDateString());
  }, []);
  return null;
}
