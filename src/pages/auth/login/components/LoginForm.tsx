import * as z from "zod";
import Link from "next/link";

import { Form, InputField } from "~/components/Form";
import { Button } from "~/components/Elements/Button";
import { api } from "~/utils/api";

const schema = z.object({
  phone: z.string().min(11).max(11, "Invalid phone number"),
  password: z.string().min(1, "Required"),
});

type LoginValues = {
  phone: string;
  password: string;
};

type LoginFormProps = {
  onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const loginMutation = api.auth.login.useMutation();
  return (
    <div>
      <Form<LoginValues, typeof schema>
        onSubmit={async (values) => {
          await loginMutation.mutateAsync(values);
          onSuccess();
        }}
        schema={schema}
      >
        {({ register, formState }) => (
          <>
            <InputField
              type="text"
              label="手机号"
              error={formState.errors["phone"]}
              registration={register("phone")}
            />
            <InputField
              type="password"
              label="Password"
              error={formState.errors["password"]}
              registration={register("password")}
            />
            <div>
              <Button
                isLoading={loginMutation.isLoading}
                type="submit"
                className="w-full"
              >
                Log in
              </Button>
            </div>
          </>
        )}
      </Form>
      <div className="mt-2 flex items-center justify-end">
        <div className="text-sm">
          <Link
            href="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
