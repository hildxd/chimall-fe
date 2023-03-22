import { useRouter } from "next/router";
import { NoneLayout } from "~/components/Layout/NoneLayout";
import { type NextPageWithLayout } from "~/pages/_app";
import { RegisterForm } from "./components/RegisterForm";

const Register: NextPageWithLayout = function () {
  const router = useRouter();
  return (
    <RegisterForm
      onSuccess={() => {
        void router.push("/");
      }}
    />
  );
};

Register.Layout = NoneLayout("注册");

export default Register;
