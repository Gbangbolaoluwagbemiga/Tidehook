import tideHookAbi from './abis/TideHook.json';
import mockERC20Abi from './abis/MockERC20.json';
import poolSwapTestAbi from './abis/PoolSwapTest.json';
import pythAbi from './abis/Pyth.json';

export const CONTRACTS = {
  TIDE_HOOK: {
    address: '0x3e80303c7ad85b43ef77ad950defcab2ed4850c8' as const,
    abi: tideHookAbi.abi,
  },
  POOL_MANAGER: '0x43821919c6a1abd93e91e10ddbfa067906708ddc' as const,
  SWAP_ROUTER: '0x509752a7f94dc1974a7e0ad2c3353bf7da6045c3' as const,
  TOKEN_0: '0x08f64c5a9d611016918a32d4598ac0e2b86569ff' as const, // USDC
  TOKEN_1: '0x7a5e743ec10ed2f2ffd410a408757e262a4428c7' as const, // ETH
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
    symbol: 'USDC',
    name: 'Mock USDC',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
  },
  {
    address: CONTRACTS.TOKEN_1,
    symbol: 'ETH',
    name: 'Mock ETH',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
];
