import WebSocket from 'ws';
import { geyserURL, meteoraPool, meteoraVault, pumpFunProgram, raydiumClmmPool, raydiumClmmVault, solanaConnection, solanaRpcUrl, stakedConnection, stakedRpcUrl, token, WSOL } from '../config'
import { TransactionType } from '../type'
import { storeTxInfo } from '../prisma'
import { jupiterSwap } from '../jupiter';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export const track = () => {
    const ws = new WebSocket(geyserURL);

    const sendRequest = (ws: WebSocket) => {
        const request = {
            jsonrpc: '2.0',
            id: 420,
            method: 'transactionSubscribe',
            params: [
                {
                    failed: false,
                    vote: false,
                    accountInclude: [meteoraPool.toBase58(), raydiumClmmPool.toBase58()],
                },
                {
                    commitment: 'processed',
                    encoding: 'jsonParsed',
                    transactionDetails: 'full',
                    maxSupportedTransactionVersion: 0,
                },
            ],
        };
        ws.send(JSON.stringify(request));
    }

    const startPing = (ws: WebSocket) => {
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
                // console.log('Ping sent');
            }
        }, 30000); // Ping every 30 seconds
    }

    ws.on('open', () => {
        console.log('WebSocket is open');
        sendRequest(ws);
        startPing(ws)
    });

    ws.on('message', async (data) => {
        const messageStr = data.toString('utf8');
        try {
            const messageObj = JSON.parse(messageStr);
            const result = messageObj.params.result;
            const logs: Array<string> = result.transaction.meta.logMessages;

            {
                const signatures = result.transaction.transaction.signatures;
                // console.log('signatures', signatures)
                const innerInstructions = result.transaction.meta.innerInstructions;
                const accountKeys = result.transaction.transaction.message.accountKeys;
                const signer = accountKeys.filter((item: any) => item.signer).map((item: any) => item.pubkey)
                // console.log('signer', signer)
                const instructions = result.transaction.transaction.message.instructions;
                const postBalances = result.transaction.meta.postBalances;
                // console.log('postBalances', postBalances)
                const preBalances = result.transaction.meta.preBalances;
                // console.log('preBalances', preBalances)
                const postTokenBalances = result.transaction.meta.postTokenBalances;
                // console.log('postTokenBalances', postTokenBalances)
                const preTokenBalances = result.transaction.meta.preTokenBalances;
                // console.log('preTokenBalances', preTokenBalances)

                let decimal = 0, preSolBalance = 0, postSolBalance = 0, preTokenbalance = 0, postTokenbalance = 0
                let owner = '', mint = ''
                let type: TransactionType | undefined
                let pool: string = ''
                let meteoraSolAmountChange = 0
                let rayClmmSolAmountChange = 0
                let arbitrage: boolean

                if (accountKeys.map((item: any) => item.pubkey).includes('Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB')) {
                    pool = 'meteora'
                    const idx = accountKeys.map((item: any) => item.pubkey).indexOf(meteoraVault.toBase58())
                    if (idx > 0) {
                        preSolBalance = preBalances[idx]
                        postSolBalance = postBalances[idx]
                        // console.log(idx, preBalances[idx], postBalances[idx])
                        meteoraSolAmountChange = preSolBalance - postSolBalance

                        if (meteoraSolAmountChange < 0) type = 'Buy'
                        else type = 'Sell'

                        console.log('ray', signatures[0], pool, type, (preSolBalance - postSolBalance) / LAMPORTS_PER_SOL)
                    }
                }
                if (accountKeys.map((item: any) => item.pubkey).includes('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')) {
                    pool = 'raydium'

                    const idx = accountKeys.map((item: any) => item.pubkey).indexOf(raydiumClmmVault.toBase58())
                    if (idx > 0) {
                        preSolBalance = preBalances[idx]
                        postSolBalance = postBalances[idx]
                        // console.log(idx, preBalances[idx], postBalances[idx])
                        rayClmmSolAmountChange = preSolBalance - postSolBalance

                        if (rayClmmSolAmountChange < 0) type = 'Buy'
                        else type = 'Sell'

                        console.log('met', signatures[0], pool, type, (preSolBalance - postSolBalance) / LAMPORTS_PER_SOL)
                    }
                }

                if (meteoraSolAmountChange * rayClmmSolAmountChange < 0) arbitrage = true
                else arbitrage = false

                const totalChange = meteoraSolAmountChange + rayClmmSolAmountChange
                console.log(Date(), signatures[0], type, totalChange / LAMPORTS_PER_SOL, arbitrage ? 'arbitrage' : '')
                console.log('----------------------------------------------------')
                if (!arbitrage && totalChange > 0) {
                    await jupiterSwap(WSOL, token.toBase58(), 1_000_000, signatures[0])
                }

            }
        } catch (err) {
            // console.error('Websocket message error:', err)
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    ws.on('close', () => {
        console.log('WebSocket is closed');
    });

}