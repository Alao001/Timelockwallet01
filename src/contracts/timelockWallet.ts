import {
    Addr,
    assert,
    bsv,
    ContractTransaction,
    hash256,
    method,
    MethodCallOptions,
    prop,
    PubKey,
    Sig,
    SmartContract,
    Utils,
} from 'scrypt-ts'

export class TimelockWallet extends SmartContract {
    @prop()
    readonly father: Addr
    @prop()
    readonly mother: Addr
    @prop()
    readonly brother: Addr
    @prop()
    readonly sister: Addr
    @prop()
    readonly matureTime: bigint

    constructor(
        father: Addr,
        mother: Addr,
        brother: Addr,
        sister: Addr,
        matureTime: bigint
    ) {
        super(...arguments)

        this.father = father
        this.mother = mother
        this.brother = brother
        this.sister = sister
        this.matureTime = matureTime
    }

    @method()
    public give(depositorSig: Sig, depositorPubkey: PubKey) {
        const amount = this.ctx.utxo.value
        assert(
            this.checkSig(depositorSig, depositorPubkey),
            ' depositor sig invalid'
        )
        assert(this.timeLock(this.matureTime), 'time lock not yet expired')
        const father_outpay = Utils.buildPublicKeyHashOutput(
            this.father,
            (amount * 35n) / 100n
        )
        const mother_outpay = Utils.buildPublicKeyHashOutput(
            this.mother,
            (amount * 35n) / 100n
        )
        const brother_outpay = Utils.buildPublicKeyHashOutput(
            this.brother,
            (amount * 15n) / 100n
        )
        const sister_outpay = Utils.buildPublicKeyHashOutput(
            this.sister,
            (amount * 15n) / 100n
        )
        const output =
            father_outpay +
            mother_outpay +
            brother_outpay +
            sister_outpay +
            this.buildChangeOutput()
        assert(hash256(output) == this.ctx.hashOutputs, 'Hashoutput mismatch')
    }

    static async buildTxforGive(
        current: TimelockWallet,
        options: MethodCallOptions<TimelockWallet>
    ): Promise<ContractTransaction> {
        const defaultChangeAddress = await current.signer.getDefaultAddress()
        const amount = 200n
        const father_outpay = Number((amount * 35n) / 100n)
        const mother_outpay = Number((amount * 35n) / 100n)
        const brother_outpay = Number((amount * 15n) / 100n)
        const sister_outpay = Number((amount * 15n) / 100n)

        const unsignedTx: bsv.Transaction = new bsv.Transaction()
            //add contract input
            .addInput(current.buildContractInput(options.fromUTXO))
            //build father output
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildPublicKeyHashScript(current.father)
                    ),
                    satoshis: father_outpay,
                })
            )
            //build mother output
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildPublicKeyHashScript(current.mother)
                    ),
                    satoshis: mother_outpay,
                })
            )
            //build brother output
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildPublicKeyHashScript(current.brother)
                    ),
                    satoshis: brother_outpay,
                })
            )
            //build sister output
            .addOutput(
                new bsv.Transaction.Output({
                    script: bsv.Script.fromHex(
                        Utils.buildPublicKeyHashScript(current.sister)
                    ),
                    satoshis: sister_outpay,
                })
            )
        if (options.lockTime) {
            unsignedTx.setLockTime(options.lockTime)
        }
        unsignedTx
            .setInputSequence(0, 0)
            //build change output
            //build change output
            .change(options.changeAddress || defaultChangeAddress)
        return {
            tx: unsignedTx,
            atInputIndex: 0,
            nexts: [],
        }
    }
}
