import { Timelockvault } from './src/contracts/timelock'
import { randomPrivateKey } from './tests/utils/txHelper'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    sha256,
    toByteString,
    Addr,
} from 'scrypt-ts'

import * as dotenv from 'dotenv'
import { myAddress } from './tests/utils/privateKey'

// Load the .env file
dotenv.config()

// Read the private key from the .env file.
// The default private key inside the .env file is meant to be used for the Bitcoin testnet.
// See https://scrypt.io/docs/bitcoin-basics/bsv/#private-keys
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer.
// See https://scrypt.io/docs/how-to-deploy-and-call-a-contract/#prepare-a-signer-and-provider
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

async function main() {
    await Timelockvault.compile()
    const [, , , fatherAddr] = randomPrivateKey()
    const [, , , motherAddr] = randomPrivateKey()
    const [, , , brotherddr] = randomPrivateKey()
    const [, , , sisterAddr] = randomPrivateKey()
    const lockTimeMin = Math.round(new Date('2023-12-27').valueOf() / 1000)
    // TODO: Adjust the amount of satoshis locked in the smart contract:
    const amount = 200

    const instance = new Timelockvault(
        Addr(fatherAddr.toByteString()),
        Addr(motherAddr.toByteString()),
        Addr(brotherddr.toByteString()),
        Addr(sisterAddr.toByteString()),
        BigInt(lockTimeMin)
        // TODO: Adjust constructor parameter values:
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log(`Timelock contract deployed: ${deployTx.id}`)
}

main()
