/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type AppProps, type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { SessionProvider } from "~/lib/session";
import { NoSSR } from "~/components/NoSSR";
import { MantineProvider } from "@mantine/core";
import { type NextPage } from "next";
import { HelmetProvider } from "react-helmet-async";
import { DefaultLayout } from "~/components/Layout/DefaultLayout";
import React from "react";

// eslint-disable-next-line @typescript-eslint/ban-types
export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  Layout?: React.ComponentType<{ children: React.ReactNode }>;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: AppType = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const Layout = Component.Layout || DefaultLayout || React.Fragment;

  return (
    <HelmetProvider>
      <SessionProvider apiClient={api} session={session}>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{
            /** Put your mantine theme override here */
            colorScheme: "light",
          }}
        >
          <NoSSR>
            <Layout {...pageProps}>
              <Component {...pageProps} />
            </Layout>
          </NoSSR>
        </MantineProvider>
      </SessionProvider>
    </HelmetProvider>
  );
};

export default api.withTRPC(MyApp);
