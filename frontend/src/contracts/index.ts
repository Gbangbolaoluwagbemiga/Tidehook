import tideHookAbi from './abis/TideHook.json';
import poolManagerAbi from './abis/IPoolManager.json';
import iTideHookAbi from './abis/ITideHook.json';

export const CONTRACTS = {
  TIDE_HOOK: {
    address: '0x1f6d39d3a463097b179c4fa147767139B86290c8' as const,
    abi: tideHookAbi,
  },
  POOL_MANAGER: {
    address: '0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f' as const,
    abi: poolManagerAbi,
  },
  REACTIVE_NETWORK: {
    address: '0xdee8489fffdb8ce1643ecd508ce1ca48575d4f31' as const,
    abi: iTideHookAbi, // TideReactive calls tickAuction on TideHook, but we can use ITideHook interface for TideHook calls
  }
};
