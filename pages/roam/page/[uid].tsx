import Layout from "../../../components/layout";
import PageView from "../../../components/Page";

export const getServerSideProps = async ({ params }) => {
  return {
    props: {
      uid: params.uid,
    },
  };
};

export default function Page({ uid }) {
  return <PageView uid={uid} />;
}
