import { expect, use } from 'chai'
import { Addr, MethodCallOptions, PubKey, findSig } from 'scrypt-ts'
import { TimelockWallet } from '../src/contracts/timelockWallet'
import { getDefaultSigner, randomPrivateKey } from './utils/txHelper'
import chaiAsPromised from 'chai-as-promised'
import { describe } from 'mocha'
import { myPublicKey } from './utils/privateKey'
use(chaiAsPromised)

describe('Test SmartContract `Timelockwallet`', () => {
    let instance: TimelockWallet
    const [, , , fatherAddr] = randomPrivateKey()
    const [, , , motherAddr] = randomPrivateKey()
    const [, , , brotherddr] = randomPrivateKey()
    const [, , , sisterAddr] = randomPrivateKey()
    const lockTimeMin = Math.round(new Date('2023-12-30').valueOf() / 1000)
    before(async () => {
        await TimelockWallet.loadArtifact()

        instance = new TimelockWallet(
            Addr(fatherAddr.toByteString()),
            Addr(motherAddr.toByteString()),
            Addr(brotherddr.toByteString()),
            Addr(sisterAddr.toByteString()),
            BigInt(lockTimeMin)
        )
        await instance.connect(getDefaultSigner())
    })

    it('should pass the public method unit test successfully.', async () => {
        instance.bindTxBuilder('give', TimelockWallet.buildTxforGive)
        const amount = 200
        const deployTx = await instance.deploy(amount)
        console.log(`Deployed contract "Timelockvault": ${deployTx.id}`)
        const today = Math.round(new Date().valueOf() / 1000)

        const call = async () => {
            const callRes = await instance.methods.give(
                (sigResps) => findSig(sigResps, myPublicKey),
                PubKey(myPublicKey.toByteString()),
                {
                    pubKeyOrAddrToSign: myPublicKey,
                    lockTime: today,
                } as MethodCallOptions<TimelockWallet>
            )
            console.log(`Called TXID: ${callRes.tx.id}`)
        }
        await expect(call()).not.to.be.rejected
    })
})
