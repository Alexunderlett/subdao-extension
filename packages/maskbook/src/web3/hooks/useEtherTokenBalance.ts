import { useAccount } from './useAccount'
import { useAsyncRetry } from 'react-use'
import { useChainId } from './useBlockNumber'
import Services from '../../extension/service'

/**
 * Fetch token balance from chain
 * @param token
 */
export function useEtherTokenBalance(address: string) {
    const account = useAccount()
    const chainId = useChainId()
    return useAsyncRetry(async () => {
        if (!account || !address) return undefined
        // return Services.Ethereum.getBalance(account, chainId)

        return undefined
    }, [account, chainId /* re-calc when switch the chain */, address])
}
