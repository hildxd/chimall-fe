import { AppShell, Navbar, Header } from '@mantine/core';

export const DefaultLayout = ({ children }: React.PropsWithChildren) => {
    return (
        <AppShell
            padding="md"
            header={<Header height={60} p="xs">{/* Header content */}</Header>}
            styles={(theme) => ({
                main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
        >
            {children}
        </AppShell>
    );
}