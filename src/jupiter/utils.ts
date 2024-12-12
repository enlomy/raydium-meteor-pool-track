import { jupiterUrl } from "../config"

export const fetchLink = async (inputMint: string, outputMint: string, amount: string, slippageBps: string, swapMode: 'ExactOut' | 'ExactIn') => {
  const link = `${jupiterUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&swapMode=${swapMode}`
  while (true) {
      try {
          const res = await fetch(link)
          return res
      } catch (e) {

      }
  }
}