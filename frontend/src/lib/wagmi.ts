import { http } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { type Chain } from 'viem';

const unichainSepolia: Chain = {
  id: 1301,
  name: 'Unichain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.unichain.org'] },
  },
  blockExplorers: {
    default: { name: 'Unichain Explorer', url: 'https://sepolia.uniscan.xyz' },
  },
  testnet: true,
};

export const config = getDefaultConfig({
  appName: 'TideHook',
  projectId: 'YOUR_PROJECT_ID',
  chains: [unichainSepolia],
  transports: {
    [unichainSepolia.id]: http(),
  },
  ssr: true,
});
