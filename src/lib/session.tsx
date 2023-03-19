import { UseMutateAsyncFunction } from '@tanstack/react-query'
import { IronSessionData } from 'iron-session'

import React, { createContext, useMemo } from 'react'
import { api } from '~/utils/api'


export const SessionContext = createContext<{
    data: IronSessionData | undefined | null
    logout: UseMutateAsyncFunction
}>({
    data: undefined,
    logout: () => Promise.resolve(),
})

export function SessionProvider({
    children,
    apiClient,
    session: preLoadData,
}: {
    children: React.ReactNode
    apiClient: typeof api,
    session?: IronSessionData
}) {
    // const trpcHandle = get(apiClient, '_system.session')
    const trpcHandle = apiClient._system.session
    if (!trpcHandle) {
        throw new Error('apiClient not found')
    }

    const logoutHandle = apiClient._system.logout
    if (!logoutHandle) {
        throw new Error('apiClient not found')
    }

    const { data, isFetched } = trpcHandle.useQuery(undefined, {
        refetchOnMount: true,
        refetchIntervalInBackground: true,
        refetchOnReconnect: true,
        refetchInterval: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
        initialData: preLoadData,
        initialDataUpdatedAt: Date.now(),
    })

    const { mutateAsync } = logoutHandle.useMutation()

    // 没有请求的时候返回取session, 请求之后直接拿session
    return (
        <SessionContext.Provider
            value={{
                data: isFetched ? data : null,
                logout: mutateAsync,
            }}
        >
            {children}
        </SessionContext.Provider>
    )
}

export function useSession() {
    return React.useContext(SessionContext)
}

/**
 * 获取用户信息
 *
 * 返回 null 的时候表示没有请求到数据，或者请求未开始
 */
export function useUser() {
    const session = useSession()
    return useMemo(() => {
        if (session === null) return null
        return session.data?.user
    }, [session])
}

export function useLogout() {
    const session = useSession()
    return session.logout
}
