import { useRef } from 'react'
import { ThemeProvider } from '@material-ui/core/styles'
import { activatedSocialNetworkUI } from '../../social-network'
import { MaskbookUIRoot } from '../../UIRoot'
import { getMaskbookTheme } from '../theme'

export function SubdaoInShadow(props: React.PropsWithChildren<{}>) {
    const useTheme = useRef(activatedSocialNetworkUI.customization.useTheme).current
    const theme = useTheme?.() || getMaskbookTheme()
    return MaskbookUIRoot(
        <ThemeProvider theme={theme}>
            <>{props.children}</>
        </ThemeProvider>,
    )
}
