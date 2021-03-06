import DashboardRouterContainer from './Container'
import { ThemeProvider, Theme } from '@material-ui/core'
const navTheme = (theme: Theme): Theme => theme

export interface DashboardNavRouterProps {
    children?: React.ReactNode
}

export default function DashboardNavRouter(props: DashboardNavRouterProps) {
    return (
        <DashboardRouterContainer title="SubDAO" compact>
            <ThemeProvider theme={navTheme}>{props.children}</ThemeProvider>
        </DashboardRouterContainer>
    )
}
