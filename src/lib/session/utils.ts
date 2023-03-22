import type { IronSession } from "./core";

export function getPropertyDescriptorForReqSession(
  session: IronSession
): PropertyDescriptor {
  return {
    enumerable: true,
    get() {
      return session;
    },
    set(value) {
      const keys = Object.keys(value);
      const currentKeys = Object.keys(session);

      currentKeys.forEach((key) => {
        if (!keys.includes(key)) {
          // @ts-ignore
          delete session[key];
        }
      });

      keys.forEach((key) => {
        // @ts-ignore
        session[key] = value[key];
      });
    },
  };
}
