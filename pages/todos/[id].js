import { useRouter } from "next/router";
import Todos from "../../components/todos";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Format e.g. March 16th, 2023 */
function dateToRoamDate(year, month, day) {
  const suffix = ["th", "st", "nd", "rd"][day % 10] || "th";
  return `${monthNames[month - 1]} ${day}${suffix}, ${year}`;
}

export async function getServerSideProps({ params }) {
  const [year, month, day] = params.id.split("-").map((s) => parseInt(s, 10));
  return {
    props: {
      page: dateToRoamDate(year, month, day),
    },
  };
}

const Page = ({ page }) => {
  console.log(page);
  return <Todos page={page} />;
};

export default Page;
