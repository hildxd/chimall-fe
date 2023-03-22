import { Box, Flex, NavLink, Text } from "@mantine/core";
import { useLogout, useUser } from "~/lib/session";
import Link from 'next/link'

export function Header() {
    const user = useUser()
    const onLogot = useLogout()
    return (
        <Flex sx={{ flexGrow: 1 }} h="60px" justify="space-between" align="center" p="10px">
            <Text>
                痴商
            </Text>
            <Flex
                h="100%"
                align="center"
                color="#fff"
                gap="sm"
                justify={"flex-end"}
                direction="row"
            >
                {user ? (
                    <>
                        欢迎您，<Link href={"/auth/login"}>{user.nickname}</Link>
                        <NavLink color="#fff" sx={{ cursor: "pointer" }} onClick={() => onLogot()}>
                            退出
                        </NavLink>
                    </>
                ) : (
                    <>
                        <Link color="#fff" href={"/auth/login"}>
                            登录
                        </Link>
                        <Link href={"/auth/register"}>注册</Link>
                    </>
                )}
                <Link href={"/auth/register"}>购物车</Link>
            </Flex>
        </Flex>
    );
}
