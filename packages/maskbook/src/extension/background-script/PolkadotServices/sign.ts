import { ApiPromise, WsProvider } from '@polkadot/api'
import { ProviderType } from '../../../web3/types'
import { getWallet } from '../../../plugins/Wallet/services'
import {
    currentSelectedWalletProviderSettings,
    currentSelectedWalletAddressSettings,
} from '../../../plugins/Wallet/settings'
import { ws_server, voteAddress } from '../../../polkadot/constants'
import { keypairType } from '../../../polkadot/constants'
import { Keyring } from '@polkadot/api'
import { getApi } from './base'

export async function getSigner() {
    const wallet = await getWallet()
    if (!wallet) throw new Error('cannot find given wallet')
    switch (currentSelectedWalletProviderSettings.value) {
        case ProviderType.SubDAO:
            const keyring = new Keyring({ type: keypairType })
            let seed: string
            if (wallet?.mnemonic?.length > 0) {
                seed = wallet?.mnemonic?.join(' ')
            } else if (wallet?._private_key_) {
                seed = wallet?._private_key_
            } else {
                throw new Error('cannot find given wallet key')
            }
            return keyring.addFromUri(seed)
        default:
            throw new Error('cannot sign with given wallet')
    }
}

export async function getBalance(address: string) {
    const api = await getApi()
    if (!api) {
        return null
    }
    const balanceAll = await api?.derive?.balances?.all(address)
    return balanceAll?.availableBalance?.toString()
}

export const getNonce = async (address?: string) => {
    const _address = address ?? currentSelectedWalletAddressSettings.value
    const api = await getApi()
    if (!api) {
        return null
    }

    const { nonce } = await api?.query?.system.account(_address)
    return nonce
}
