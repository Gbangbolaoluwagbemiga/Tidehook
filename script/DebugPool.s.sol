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
        address poolManager = 0x5Cedfac8F2bD9E2F65eed137E5a7da2774C842dC;
        address hookAddress = 0x7AbfC2A7fDC534079DCBD98015E90434ced610c8;
        address token0 = 0xBD977222113B7bD996f49422eD06C388503C67f9;
        address token1 = 0xAC30dEE67C52fc0D28A5c99dD884fa2be476911F;

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
