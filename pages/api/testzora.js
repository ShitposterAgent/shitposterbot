import { networkId, generateAddress } from '@neardefi/shade-agent-js';
import { evm } from '../../utils/evm';

export default async function testzora(req, res) {
    const path = 'foo',
        name = 'bar' + Date.now(),
        symbol = 'TST',
        funder = '0x525521d79134822a342d330bd91DA67976569aF1',
        uri =
            'https://ipfs.io/ipfs/QmafHj1eVJgMzSVRYTXHevifoNnqit9hvapEaX41tpVcP1';

    // generate deposit address
    const { address } = await generateAddress({
        publicKey:
            networkId === 'testnet'
                ? process.env.MPC_PUBLIC_KEY_TESTNET
                : process.env.MPC_PUBLIC_KEY_MAINNET,
        accountId: 'shadeagent.near',
        path,
        chain: 'evm',
    });

    const result = evm.deployZora({ path, name, symbol, funder, address, uri });

    res.status(200).json({ result });
}
