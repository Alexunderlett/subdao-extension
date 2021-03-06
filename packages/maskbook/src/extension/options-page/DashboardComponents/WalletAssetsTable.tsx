import React, { useEffect, useMemo } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    makeStyles,
    Skeleton,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Theme,
    Collapse,
    MenuItem,
    Typography,
} from '@material-ui/core'
import { useCopyToClipboard } from 'react-use'
import classNames from 'classnames'
import MoreHorizIcon from '@material-ui/icons/MoreHoriz'
import { useSnackbar } from 'notistack'
import { useStylesExtends } from '../../../components/custom-ui-helper'
import { useI18N } from '../../../utils/i18n-next-ui'
import type { TokenDetailedType } from '../../../polkadot/types'
import { formatPolkadotAddress } from '../../../plugins/Wallet/formatter'
import type { WalletRecord } from '../../../plugins/Wallet/database/types'
import { TokenIcon } from './TokenIcon'
import { useContext, useState } from 'react'
import { DashboardWalletsContext } from '../DashboardRouters/Wallets'
import { DashboardWalletTransferDialog } from './TransferDialog'
import { useModal } from '../DashboardDialogs/Base'
import { Send as SendIcon } from 'react-feather'
import ExpandLessIcon from '@material-ui/icons/ExpandLess'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import type { DeriveBalancesAll } from '@polkadot/api-derive/types'

import FormatBalance from '../../../polkadot/components/FormatBalance'
import { useTransferTokenCallback } from '../../../polkadot/hooks/useTransferTokenCallback'
import { PolkadotTransactionStateType as StateType } from '../../../polkadot/hooks/useTransactionState'
import { ActionType } from '../../../polkadot/types'
import { useToggle } from '../../../utils/hooks/useToogle'

import { WalletRPC } from '../../../plugins/Wallet/messages'
import { useERC20TokensFromDB } from '../../../plugins/Wallet/hooks/useERC20Token'
import { useERC20TokenBalance } from '../../../polkadot/hooks/useERC20TokenBalance'
import { useMenu } from '../../../utils/hooks/useMenu'
import { useColorStyles } from '../../../utils/theme'
import { formatBalance } from '@polkadot/util'
import { useSnackbarCallback } from '../DashboardDialogs/Base'

const MAX_TOKENS_LENGTH = 5
const MIN_VALUE = 5

const circleIcon = <CircularProgress color="inherit" size={12} />
const sendIcon = <SendIcon size={12} />

const useStyles = makeStyles((theme: Theme) => ({
    container: {
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        padding: theme.spacing(0),
    },
    table: {},
    actionCell: {
        minWidth: '10rem',
    },
    head: {
        backgroundColor: theme.palette.mode === 'light' ? theme.palette.common.white : 'var(--drawerBody)',
    },
    cell: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(1.5),
        whiteSpace: 'nowrap',
    },
    record: {
        display: 'flex',
    },
    coin: {
        width: 24,
        height: 24,
    },
    name: {
        marginLeft: theme.spacing(1),
    },
    balanceMore: {
        marginLeft: theme.spacing(0.5),
    },
    balanceName: {
        minWidth: '15rem',
    },
    actionButton: {
        '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: 'white',
        },
    },
    more: {
        color: theme.palette.text.primary,
    },
    lessButton: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: theme.spacing(1),
    },
}))

//#region view detailed
interface ViewDetailedProps extends withClasses<KeysInferFromUseStyles<typeof useStyles>> {
    token?: any
    balanceAll?: any
    address?: string
    wallet: WalletRecord
    isERC20?: boolean
    transferState: any
    detailedToken?: any
}

function ViewDetailed(props: ViewDetailedProps) {
    const { t } = useI18N()
    const { wallet, transferState, token, balanceAll, isERC20 = false, address = '', detailedToken = {} } = props

    const classes = useStylesExtends(useStyles(), props)
    const [isPopupOpen, togglePopupOpen] = useToggle()

    const disabledList = [StateType.WAIT_FOR_CONFIRMING, StateType.IS_IN_BLOCK]
    const btnDisabled = disabledList.includes(transferState?.type)
    const btnStartIcon = btnDisabled ? circleIcon : sendIcon
    const { value: balance, loading } = useERC20TokenBalance(isERC20 ? token?.address : null)

    const [, copyToClipboard] = useCopyToClipboard()
    const onCopy = useSnackbarCallback(
        async (ev: React.MouseEvent<HTMLDivElement>) => {
            ev.stopPropagation()
            copyToClipboard(token.address ?? '')
        },
        [],
        undefined,
        undefined,
        undefined,
        t('copy_success_of_token_addr'),
    )

    const tokenName = !!token.name.trim() ? token.name : token.symbol
    let balances = useMemo(() => {
        if (balance) {
            return formatBalance(String(balance), {
                forceUnit: '-',
                withUnit: token.symbol,
                decimals: token.decimals,
            })
        }
        return 0
    }, [balance, token.symbol, token.decimals])
    balances = balances !== '0' ? balances : `0 ${token.symbol}`
    const allItems: React.ReactNode[] = []
    const [transeferDialog, , openTransferDialogOpen] = useModal(DashboardWalletTransferDialog)
    const color = useColorStyles()
    const removeToken = () => {
        WalletRPC.removeERC20Token(token)
    }
    const [menu, openMenu] = useMenu([
        <MenuItem onClick={() => removeToken()} className={color.error}>
            {t('delete')}
        </MenuItem>,
    ])
    balanceAll &&
        (balanceAll as DeriveBalancesAll).availableBalance &&
        allItems.push(
            <Typography key={1}>
                {t('transferrable')}
                <FormatBalance
                    className={classes.balanceMore}
                    value={(balanceAll as DeriveBalancesAll).availableBalance}
                />
            </Typography>,
        )
    balanceAll?.reservedBalance?.gtn(0) &&
        allItems.push(
            <Typography key={2}>
                {t('reserved')}
                <FormatBalance className={classes.balanceMore} value={balanceAll.reservedBalance} />
            </Typography>,
        )

    return (
        <TableRow className={classes.cell}>
            {[
                <Box
                    onClick={onCopy}
                    sx={{
                        display: 'flex',
                        cursor: 'pointer',
                    }}>
                    <TokenIcon classes={{ icon: classes.coin }} name={token.name} address={address} />
                    {!isERC20 ? (
                        <Typography className={classes.name}>{`${wallet.name}(${formatPolkadotAddress(
                            address,
                            4,
                        )})`}</Typography>
                    ) : (
                        <Typography className={classes.name}>{tokenName}</Typography>
                    )}
                </Box>,
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        flexDirection: 'column',
                        textAlign: 'right',
                        flex: 1,
                    }}>
                    {!isERC20 ? (
                        <>
                            <Typography className={classes.balanceName} color="textPrimary" component="span">
                                <FormatBalance
                                    value={balanceAll && balanceAll.freeBalance.add(balanceAll.reservedBalance)}
                                />
                                <IconButton color="inherit" size="small" onClick={togglePopupOpen}>
                                    {!isPopupOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                </IconButton>
                            </Typography>
                            <Collapse in={isPopupOpen} timeout="auto" unmountOnExit>
                                {allItems}
                            </Collapse>
                        </>
                    ) : (
                        <Typography className={classes.balanceName} color="textPrimary" component="span">
                            {balances}
                        </Typography>
                    )}
                </Box>,
                <Box
                    className={classes.actionCell}
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}>
                    {!isERC20 ? (
                        <Button
                            className={classes.actionButton}
                            startIcon={btnStartIcon}
                            color="primary"
                            disabled={btnDisabled}
                            onClick={() => openTransferDialogOpen({ wallet, ...detailedToken })}>
                            {t('wallet_transfer_title')}
                        </Button>
                    ) : (
                        <>
                            <Button
                                className={classes.actionButton}
                                startIcon={btnStartIcon}
                                color="primary"
                                disabled={btnDisabled}
                                onClick={() => openTransferDialogOpen({ wallet, ...detailedToken, token })}>
                                {t('wallet_transfer_title')}
                            </Button>
                            <IconButton
                                className={classes.more}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    openMenu(e)
                                }}>
                                <MoreHorizIcon />
                            </IconButton>
                            {menu}
                        </>
                    )}
                </Box>,
            ]
                .filter(Boolean)
                .map((y, i) => (
                    <TableCell className={classes.cell} key={i}>
                        {y}
                    </TableCell>
                ))}
            {transeferDialog}
        </TableRow>
    )
}
//#endregion

export interface WalletAssetsTableProps extends withClasses<KeysInferFromUseStyles<typeof useStyles>> {
    wallet: WalletRecord
    state: any
    dispatch: any
}
export function WalletAssetsTable(props: WalletAssetsTableProps) {
    const { t } = useI18N()
    const { wallet, state, dispatch } = props
    const { detailedToken, detailedTokensLoading, detailedTokensRetry } = useContext(DashboardWalletsContext)

    const classes = useStylesExtends(useStyles(), props)
    const LABELS = [t('wallet_assets'), t('wallet_balance'), ''] as const

    const [more, setMore] = useState<boolean>(false)

    const { enqueueSnackbar } = useSnackbar()
    const { transferState } = state
    const { balanceAll, address, token } = detailedToken

    const erc20Tokens = useERC20TokensFromDB()

    useEffect(() => {
        if (transferState?.type === StateType.UNKNOWN) return
        if (transferState?.type === StateType.IS_IN_BLOCK || transferState?.type === StateType.CONFIRMED) {
            enqueueSnackbar(t('transfer_in_finalized'), {
                variant: 'success',
            })
            detailedTokensRetry()
            dispatch({
                type: ActionType.SET_TRANSFER_STATE,
                payload: {
                    state: null,
                },
            })
        }
    }, [
        transferState?.type,
        enqueueSnackbar,
        detailedTokensRetry,
        t,
        dispatch /* update tx dialog only if state changed */,
    ])

    //#region transfer tokens
    if (detailedTokensLoading || !detailedToken) return null

    if (!detailedToken?.balanceAll || state.apiState !== 'READY')
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                }}>
                <Typography color="textSecondary">No token found.</Typography>
                <Button
                    sx={{
                        marginTop: 1,
                    }}
                    variant="text"
                    onClick={() => detailedTokensRetry()}>
                    Retry
                </Button>
            </Box>
        )

    return (
        <>
            <TableContainer className={classes.container}>
                <Table className={classes.table} component="table" size="medium" stickyHeader>
                    <TableHead className={classes.head}>
                        <TableRow>
                            {LABELS.map((x, i) => (
                                <TableCell
                                    className={classNames(classes.head, classes.cell)}
                                    key={i}
                                    align={i === 0 ? 'left' : 'right'}>
                                    {x}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {detailedTokensLoading ? (
                            new Array(3).fill(0).map((_, i) => (
                                <TableRow className={classes.cell} key={i}>
                                    <TableCell>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            width="100%"
                                            height={30}></Skeleton>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            width="100%"
                                            height={30}></Skeleton>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            width="100%"
                                            height={30}></Skeleton>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            width="100%"
                                            height={30}></Skeleton>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton
                                            animation="wave"
                                            variant="rectangular"
                                            width="100%"
                                            height={30}></Skeleton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <>
                                <ViewDetailed
                                    address={address}
                                    balanceAll={balanceAll}
                                    key={address}
                                    detailedToken={detailedToken}
                                    token={token}
                                    wallet={wallet}
                                    transferState={transferState}
                                />
                                {more &&
                                    erc20Tokens?.map((o, idx) => (
                                        <ViewDetailed
                                            isERC20
                                            key={idx}
                                            token={o}
                                            transferState={transferState}
                                            wallet={wallet}
                                        />
                                    ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            {Boolean(erc20Tokens?.length) && (
                <div className={classes.lessButton}>
                    <IconButton
                        onClick={() => {
                            setMore(!more)
                        }}>
                        {more ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                </div>
            )}
        </>
    )
}
