import WebSocket from 'ws';
import { geyserURL, meteoraPool, pumpFunProgram, raydiumClmmPool } from '../config'
import { TransactionType } from '../type'
import { storeTxInfo } from '../prisma'

export const runWebsocket = () => {

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
                console.log('Ping sent');
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
                console.log('signatures', signatures)
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
                let type: TransactionType

                if (accountKeys.map((item: any) => item.pubkey).includes('Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB')) {
                    console.log('meteora')
                } else if (accountKeys.map((item: any) => item.pubkey).includes('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')) {
                    console.log('raydium clmm')
                }

                if (accountKeys.map((item: any) => item.pubkey).includes('JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4')) {
                    console.log('jupiter')
                }

                preTokenBalances.map((item: any) => {
                    if (signer.includes(item.owner) && item.mint == 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa') {
                        preTokenbalance = item.uiTokenAmount.uiAmount
                        decimal = item.uiTokenAmount.decimals
                        mint = item.mint
                        owner = item.owner
                        // console.log('preTokenbalance', preTokenbalance, decimal, mint, owner)
                    }
                })

                postTokenBalances.map((item: any) => {
                    if (signer.includes(item.owner) && item.mint == 'SENDdRQtYMWaQrBroBrJ2Q53fgVuq95CV9UPGEvpCxa') {
                        postTokenbalance = item.uiTokenAmount.uiAmount
                        decimal = item.uiTokenAmount.decimals
                        mint = item.mint
                        owner = item.owner
                        // console.log('postTokenbalance', postTokenbalance, decimal, mint, owner)
                    }
                })

                if (owner && (preTokenbalance || postTokenbalance)) {
                    const idx = accountKeys.map((item: any) => item.pubkey).indexOf(owner)
                    preSolBalance = preBalances[idx]
                    postSolBalance = postBalances[idx]
                    // console.log('sol balance', preSolBalance, postSolBalance)
                }

                const tokenAmountChange = (postTokenbalance - preTokenbalance)
                const solAmountChange = (postSolBalance - preSolBalance) / Math.pow(10, 9)

                if (tokenAmountChange != 0 && solAmountChange != 0) {
                    if (tokenAmountChange > 0) type = 'Buy'
                    else type = 'Sell'

                    console.log(owner, mint, signatures[0], type, tokenAmountChange, decimal, solAmountChange)
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