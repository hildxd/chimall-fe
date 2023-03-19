import React from 'react'

export function NoSSR(props: React.PropsWithChildren<{}>) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
        setMounted(true)
    }, [])
    if (!mounted) {
        return null
    }
    return <>{props.children}</>
}
