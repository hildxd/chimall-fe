import type { IncomingMessage, ServerResponse } from "http";

import cookie, { type CookieSerializeOptions } from "cookie";
import * as Iron from "iron-webcrypto";

// default time allowed to check for iron seal validity when ttl passed
// see https://hapi.dev/family/iron/api/?v=6.0.0#options
const timestampSkewSec = 60;

type passwordsMap = { [id: string]: string };
type password = string | passwordsMap;

const fourteenDaysInSeconds = 15 * 24 * 3600;

// We store a token major version to handle data format changes when any. So that when you upgrade the cookies
// can be kept alive between upgrades, no need to disconnect everyone.
const currentMajorVersion = 2;
const versionDelimiter = "~";

const defaultOptions: {
  ttl: number;
  cookieOptions: CookieSerializeOptions;
} = {
  ttl: fourteenDaysInSeconds,
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  },
};

export type IronSessionOptions = {
  cookieName: string;
  password: password;
  ttl?: number;
  cookieOptions?: CookieSerializeOptions;
};

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type IronSessionData = {
  user?: Omit<UserInfoState, "token">;
  token?: string;
};

export type IronSession = IronSessionData & {
  /**
   * Destroys the session data and removes the cookie.
   */
  destroy: () => void;

  /**
   * Encrypts the session data and sets the cookie.
   */
  save: () => Promise<void>;
};

declare module "http" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface IncomingMessage {
    session: IronSession;
  }
}

type RequestType = IncomingMessage | Request;
type ResponseType = ServerResponse | Response;

export function createGetIronSession(
  _crypto: Crypto,
  unsealData: ReturnType<typeof createUnsealData>,
  sealData: ReturnType<typeof createSealData>
) {
  return async (
    req: RequestType,
    res: ResponseType,
    userSessionOptions: IronSessionOptions
  ): Promise<IronSession> => {
    if (
      !req ||
      !res ||
      !userSessionOptions ||
      !userSessionOptions.cookieName ||
      !userSessionOptions.password
    ) {
      throw new Error(
        `iron-session: Bad usage. Minimum usage is const session = await getIronSession(req, res, { cookieName: "...", password: "...". Check the usage here: https://github.com/vvo/iron-session`
      );
    }

    const passwordsAsMap = normalizeStringPasswordToMap(
      userSessionOptions.password
    );

    Object.values(
      normalizeStringPasswordToMap(userSessionOptions.password)
    ).forEach((password) => {
      if (password.length < 32) {
        throw new Error(
          `iron-session: Bad usage. Password must be at least 32 characters long.`
        );
      }
    });

    const options: Required<IronSessionOptions> = {
      ...defaultOptions,
      ...userSessionOptions,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      cookieOptions: {
        ...defaultOptions.cookieOptions,
        ...(userSessionOptions.cookieOptions || {}),
      },
    };

    if (options.ttl === 0) {
      // ttl = 0 means no expiration
      // but in reality cookies have to expire (can't have no max-age)
      // 2147483647 is the max value for max-age in cookies
      // see https://stackoverflow.com/a/11685301/147079
      options.ttl = 2147483647;
    }

    if (
      userSessionOptions.cookieOptions &&
      "maxAge" in userSessionOptions.cookieOptions
    ) {
      // session cookie, do not set maxAge, consider token as infinite
      if (userSessionOptions.cookieOptions.maxAge === undefined) {
        options.ttl = 0;
      } else {
        options.cookieOptions.maxAge = computeCookieMaxAge(
          userSessionOptions.cookieOptions.maxAge
        );
      }
    } else {
      options.cookieOptions.maxAge = computeCookieMaxAge(options.ttl);
    }

    const sealFromCookies = cookie.parse(
      "credentials" in req
        ? req.headers.get("cookie") || ""
        : req.headers.cookie || ""
    )[options.cookieName];

    const session =
      sealFromCookies === undefined
        ? {}
        : await unsealData<IronSessionData>(sealFromCookies, {
            password: passwordsAsMap,
            ttl: options.ttl,
          });

    Object.defineProperties(session, {
      save: {
        value: async function save() {
          if ("headersSent" in res && res.headersSent === true) {
            throw new Error(
              `iron-session: Cannot set session cookie: session.save() was called after headers were sent. Make sure to call it before any res.send() or res.end()`
            );
          }
          const seal = await sealData(session, {
            password: passwordsAsMap,
            ttl: options.ttl,
          });
          const cookieValue = cookie.serialize(
            options.cookieName,
            seal,
            options.cookieOptions
          );

          if (cookieValue.length > 4096) {
            throw new Error(
              `iron-session: Cookie length is too big ${cookieValue.length}, browsers will refuse it. Try to remove some data.`
            );
          }

          addToCookies(cookieValue, res);
        },
      },
      destroy: {
        value: function destroy() {
          Object.keys(session).forEach((key) => {
            // @ts-ignore
            delete session[key];
          });

          const cookieValue = cookie.serialize(options.cookieName, "", {
            ...options.cookieOptions,
            maxAge: 0,
          });
          addToCookies(cookieValue, res);
        },
      },
    });

    return session as IronSession;
  };
}

function addToCookies(cookieValue: string, res: ResponseType) {
  if ("headers" in res) {
    res.headers.append("set-cookie", cookieValue);
    return;
  }

  let existingSetCookie =
    (res.getHeader("set-cookie") as string[] | string) ?? [];
  if (typeof existingSetCookie === "string") {
    existingSetCookie = [existingSetCookie];
  }
  res.setHeader("set-cookie", [...existingSetCookie, cookieValue]);
}

function computeCookieMaxAge(ttl: number) {
  // The next line makes sure browser will expire cookies before seals are considered expired by the server.
  // It also allows for clock difference of 60 seconds maximum between server and clients.
  // It also makes sure to expire the cookie immediately when value is 0
  return ttl - timestampSkewSec;
}

export function createUnsealData(_crypto: Crypto) {
  return async <T = Record<string, unknown>>(
    seal: string,
    {
      password,
      ttl = fourteenDaysInSeconds,
    }: { password: password; ttl?: number }
  ): Promise<T> => {
    const passwordsAsMap = normalizeStringPasswordToMap(password);
    const { sealWithoutVersion, tokenVersion } = parseSeal(seal);

    try {
      const data =
        (await Iron.unseal(_crypto, sealWithoutVersion, passwordsAsMap, {
          ...Iron.defaults,
          ttl: ttl * 1000,
        })) || {};

      if (tokenVersion === 2) {
        return data as T;
      }

      return {
        ...data.persistent,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message === "Expired seal" ||
          error.message === "Bad hmac value" ||
          error.message.startsWith("Cannot find password: ") ||
          error.message === "Incorrect number of sealed components"
        ) {
          // if seal expired or
          // if seal is not valid (encrypted using a different password, when passwords are badly rotated) or
          // if we can't find back the password in the seal
          // then we just start a new session over
          return {} as T;
        }
      }

      throw error;
    }
  };
}

function parseSeal(seal: string): {
  sealWithoutVersion: string;
  tokenVersion: number | null;
} {
  if (seal[seal.length - 2] === versionDelimiter) {
    const [sealWithoutVersion, tokenVersionAsString] =
      seal.split(versionDelimiter);
    return {
      sealWithoutVersion,
      tokenVersion: parseInt(tokenVersionAsString, 10),
    };
  }

  return { sealWithoutVersion: seal, tokenVersion: null };
}

export function createSealData(_crypto: Crypto) {
  return async (
    data: unknown,
    {
      password,
      ttl = fourteenDaysInSeconds,
    }: { password: password; ttl?: number }
  ) => {
    const passwordsAsMap = normalizeStringPasswordToMap(password);

    const mostRecentPasswordId = Math.max(
      ...Object.keys(passwordsAsMap).map((id) => parseInt(id, 10))
    );

    const passwordForSeal = {
      id: mostRecentPasswordId.toString(),
      secret: passwordsAsMap[mostRecentPasswordId],
    };

    const seal = await Iron.seal(_crypto, data, passwordForSeal, {
      ...Iron.defaults,
      ttl: ttl * 1000,
    });

    return `${seal}${versionDelimiter}${currentMajorVersion}`;
  };
}

function normalizeStringPasswordToMap(password: password) {
  return typeof password === "string" ? { 1: password } : password;
}
