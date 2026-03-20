// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

contract DebugPool is Script {
    using PoolIdLibrary for PoolKey;
    using StateLibrary for IPoolManager;

    function run() public view {
        address poolManager = 0x59Df08019Efcbe82bB35d6888F0Df28b97950c00;
        address hookAddress = 0xF2C8a4F509B2b97f4664848f1AF5166E9c4290c8;
        address token0 = 0x800131A94588a79dEC1E317B6B3E3f9F92684930;
        address token1 = 0x6a4be55c36495c0203464b6504F95E42d7E76fC1;

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0 < token1 ? token0 : token1),
            currency1: Currency.wrap(token0 < token1 ? token1 : token0),
            fee: 0x800000, 
            tickSpacing: 60,
            hooks: IHooks(hookAddress)
        });

        (uint160 sqrtPriceX96, int24 tick, , ) = IPoolManager(poolManager).getSlot0(key.toId());
        uint128 liquidity = IPoolManager(poolManager).getLiquidity(key.toId());

        console.log("--- Pool Debug Info ---");
        console.log("Pool ID:", vm.toString(PoolId.unwrap(key.toId())));
        console.log("sqrtPriceX96:", uint256(sqrtPriceX96));
        console.log("Current Tick:", tick);
        console.log("Liquidity (L):", liquidity);
        
        if (sqrtPriceX96 == 0) {
            console.log("WARNING: Pool does not seem to exist or is uninitialized!");
        }
    }
}
