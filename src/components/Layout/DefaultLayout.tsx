import { AppShell } from '@mantine/core';
import { Header } from './Header'

export const DefaultLayout = ({ children }: React.PropsWithChildren) => {
    return (
        <AppShell
            padding="md"
            header={<Header />}
            styles={(theme) => ({
                main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
        >
            {children}
        </AppShell>
    );
}