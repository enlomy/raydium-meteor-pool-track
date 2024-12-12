import { jupiterUrl, mainKeypair, stakedConnection } from "../config"
import { fetchLink } from "./utils"
import { VersionedTransaction } from '@solana/web3.js'

export const jupiterSwap = async (main: string, bridge: string, amount: number, direction: 'ExactOut' | 'ExactIn', originSig?: string) => {
  try {
    const slippage = 10000
    console.log('getting quote...')
    const quote = await (await fetchLink(main, bridge, amount.toString(), slippage.toString(), direction)).json()
    
    if (!quote) {
      console.error('empty quote')
      return
    }

    const rawTransaction = await (
      await fetch(`${jupiterUrl}/swap`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: mainKeypair.publicKey.toString(),
          wrapAndUnwrapSol: true,
          useSharedAccounts: false,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 50000
        }),
      })
    ).json();

    if (!rawTransaction) {
      console.error('empty raw transaction')
      return
    }

    // @ts-ignore
    const swapTransaction = rawTransaction.swapTransaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const vtx = VersionedTransaction.deserialize(swapTransactionBuf);
    vtx.sign([mainKeypair])
    // const sim = await stakedConnection.simulateTransaction(vtx, { sigVerify: true })
    // console.log(sim)
    try {
      console.log('buying')
      const sig = await stakedConnection.sendTransaction(vtx)
      const confirm = await stakedConnection.confirmTransaction(sig)
      console.log('swap sig ===>>>', `https://solscan.io/tx/${sig} https://solscan.io/tx/${originSig}`)
    } catch (e) {
      console.error(e)
    }
  } catch (e) {
    console.error(e)
  }
}