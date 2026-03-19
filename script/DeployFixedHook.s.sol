// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {TideHook} from "../src/TideHook.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

contract DeployFixedHook is Script {
    using PoolIdLibrary for PoolKey;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        // 1. Existing infrastructure
        IPoolManager manager = IPoolManager(0xc0Dc061443bFaE89d150a5a8460f3767E229A624);
        address token0 = 0x80eEaE08a46eF968Ba85e1862FCfE37072981a34; // USDC
        address token1 = 0xA07f578857c52674493953F7CAF119e9D29e36B7; // ETH
        
        Currency currency0 = Currency.wrap(token0 < token1 ? token0 : token1);
        Currency currency1 = Currency.wrap(token0 < token1 ? token1 : token0);
        
        address REACTIVE_NETWORK = deployerAddress; // user wallet is relay

        vm.startBroadcast(deployerPrivateKey);

        // 2. Deploy Hook (with robustness fix)
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );
        
        // Use a new salt for a fresh address
        (address hookAddress, bytes32 salt) = HookMiner.find(
            0x4e59b44847b379578588920cA78FbF26c0B4956C,
            flags,
            type(TideHook).creationCode,
            abi.encode(manager, REACTIVE_NETWORK)
        );
        
        TideHook hook = new TideHook{salt: salt}(manager, REACTIVE_NETWORK);
        console.log("Deployed FIXED Hook at:", address(hook));

        // 3. Initialize Pool
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: 0x800000, // DYNAMIC_FEE_FLAG
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        manager.initialize(key, 79228162514264337593543950336);
        console.log("Pool initialized on existing manager");

        // 4. Config Hook
        hook.setPoolConfig(key.toId(), ITideHook.TideConfig({
            whaleThreshold: 500_000 * 10**18,
            auctionDuration: 300,
            whaleFeeBps: 100,
            retailFeeBps: 30
        }));
        
        vm.stopBroadcast();
    }
}
