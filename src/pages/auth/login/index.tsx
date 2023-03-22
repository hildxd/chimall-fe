import { useRouter } from "next/router";
import { NoneLayout } from "~/components/Layout/NoneLayout";
import { type NextPageWithLayout } from "~/pages/_app";
import { LoginForm } from "./components/LoginForm";

const LoginPage: NextPageWithLayout = function () {
  const router = useRouter();
  return (
    <LoginForm
      onSuccess={() => {
        void router.push("/");
      }}
    />
  );
};

LoginPage.Layout = NoneLayout("登录");

export default LoginPage;
