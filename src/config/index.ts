import dotenv from 'dotenv'
import bs58 from 'bs58'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { AnchorProvider } from '@coral-xyz/anchor'
dotenv.config()

const solanaRpcUrl = process.env.MAIN_RPC_URL!
const solanaWssUrl = process.env.MAIN_WSS_URL!
const devRpcUrl = process.env.DEV_RPC_URL!
const devWssUrl = process.env.DEV_WSS_URL!
const mainKeypairHex = process.env.MAIN_KEYPAIR_HEX!
const mainKeypair = Keypair.fromSecretKey(bs58.decode(mainKeypairHex))
const wallet = new NodeWallet(mainKeypair)

export const geyserURL = process.env.GEYSER_URL!
export const port = process.env.PORT!
export const solanaConnection = new Connection(solanaRpcUrl, { wsEndpoint: solanaWssUrl })
export const devConnection = new Connection(devRpcUrl, { wsEndpoint: devWssUrl })
export const provider = new AnchorProvider(solanaConnection, wallet, {
    commitment: "finalized",
});

export const systemProgram = new PublicKey('11111111111111111111111111111111')
export const eventAuthority = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1')
export const pumpFunProgram = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
export const meteoraPool = new PublicKey('ESr8SbVGgbMRCgCDDfL9x8DwPGLdAtgLLKKGx3UUKoaq')
export const raydiumClmmPool = new PublicKey('8L26HZxqEGAgbmLawYdjXAKiVpiNXcYYm9u21s2Tixu')
export const rentProgram = new PublicKey('SysvarRent111111111111111111111111111111111')
export enum commitmentType {
    Finalized = "finalized",
    Confirmed = "confirmed",
    Processed = "processed"
}