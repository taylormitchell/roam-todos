import Link from "next/link";
import Todos from "../../components/todos";
import { getRoamDateString, getDateString } from "../../lib/date";

export default function Upcoming() {
  return (
    <div>
      <h1>Upcoming</h1>
      {Array.from({ length: 2 }).map((_, i) => {
        const page = getRoamDateString(i);
        return (
          <div key={i}>
            <h2>
              <Link href={`/date/${getDateString(i)}`}>{page}</Link>
            </h2>
            <Todos page={page} />
          </div>
        );
      })}
    </div>
  );
}
