import { useRouter } from "next/router";
import Todos from "../../components/todos";
import { GetServerSideProps } from "next";
import { dateToRoamDate } from "../../lib/date";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;
  const [year, month, day] = id.split("-").map((s) => parseInt(s, 10));
  const roamDate = dateToRoamDate(year, month, day);
  return {
    props: {
      page: roamDate,
    },
  };
};

export default function Page({ page }) {
  return (
    <>
      <h1>{page}</h1>
      <Todos page={page} />
    </>
  );
}
