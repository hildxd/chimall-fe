import * as z from "zod";
import Link from "next/link";

import { Form, InputField } from "~/components/Form";
import { Button } from "~/components/Elements/Button";
import { api } from "~/utils/api";

const schema = z.object({
  phone: z.string().min(11).max(11, "Invalid phone number"),
  password: z.string().min(1, "Required"),
});

type RegisterValues = {
  phone: string;
  password: string;
};

type RegisterProps = {
  onSuccess: () => void;
};

export const RegisterForm = ({ onSuccess }: RegisterProps) => {
  const registerMutation = api.auth.register.useMutation();
  return (
    <div>
      <Form<RegisterValues, typeof schema>
        onSubmit={async (values) => {
          await registerMutation.mutateAsync(values);
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
                isLoading={registerMutation.isLoading}
                type="submit"
                className="w-full"
              >
                Reigster
              </Button>
            </div>
          </>
        )}
      </Form>
      <div className="mt-2 flex items-center justify-end">
        <div className="text-sm">
          <Link
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
