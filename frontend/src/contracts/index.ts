import tideHookAbi from './abis/TideHook.json';
import mockERC20Abi from './abis/MockERC20.json';
import poolSwapTestAbi from './abis/PoolSwapTest.json';
import pythAbi from './abis/Pyth.json';

export const CONTRACTS = {
  TIDE_HOOK: {
    address: '0xd6d82258e3c0d0c7b24d7284791dd5979206d0c8' as const,
    abi: tideHookAbi.abi,
  },
  POOL_MANAGER: '0xf2f57549bb79b00aa11e44716d9a3ec34452dc27' as const,
  SWAP_ROUTER: '0xa97a9202b131f94050f38dee5dd8b3393b0d2367' as const,
  TOKEN_0: '0x2f9debe9d9fa5d076505e8f60c69af0cc6646d9a' as const, // ETH
  TOKEN_1: '0x717c07cdeaa2b733e3a5675da4cf60192e7d16b4' as const, // USDC
  REACTIVE_NETWORK: '0x3Be7fbBDbC73Fc4731D60EF09c4BA1A94DC58E41' as const,
  PYTH_ORACLE: {
    address: '0x2880aB155794e7179c9eE2e38200202908C17B43' as const,
    abi: pythAbi,
  },
  FEEDS: {
    ETH_USD: '0xff61491a97129eb27c65c40134446a294a5065c799863ca351239aa3da518359' as const,
    USDC_USD: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a' as const,
  },
};

export const TOKEN_LIST = [
  {
    address: CONTRACTS.TOKEN_0,
    symbol: 'ETH',
    name: 'Mock ETH',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  {
    address: CONTRACTS.TOKEN_1,
    symbol: 'USDC',
    name: 'Mock USDC',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
];
