import { useRef } from 'react'
import { isServer } from 'utils/isServer'

import { useIsomorphicEffect, useUnmount } from 'hooks'

export function useDocumentTitle(
    title,
    options = {},
) {
    const { preserveTitleOnUnmount = true } = options
    const defaultTitle = useRef(null)

    useIsomorphicEffect(() => {
        if (!isServer) {
            defaultTitle.current = document.title
        }
    }, [])

    useIsomorphicEffect(() => {
        if (!isServer && title) {
            document.title = title
        }
    }, [title])

    useUnmount(() => {
        if (!isServer && !preserveTitleOnUnmount && defaultTitle.current) {
            document.title = defaultTitle.current
        }
    })
}
