import './setup.ui'
import { isEnvironment, Environment } from '@dimensiondev/holoflows-kit'
if (isEnvironment(Environment.ContentScript)) {
    console.log('SubDAO content script loaded')
    require('./extension/content-script/index')
}
export default undefined
