// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";

contract RefillPool is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hookAddress = 0x93f208B191891A22289Ee91dD45aF11670A0D0c8;
        address poolManager = 0xc0Dc061443bFaE89d150a5a8460f3767E229A624;
        
        address token0 = 0x80eEaE08a46eF968Ba85e1862FCfE37072981a34;
        address token1 = 0xA07f578857c52674493953F7CAF119e9D29e36B7;

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0 < token1 ? token0 : token1),
            currency1: Currency.wrap(token0 < token1 ? token1 : token0),
            fee: 0x800000, 
            tickSpacing: 60,
            hooks: IHooks(hookAddress)
        });

        vm.startBroadcast(deployerPrivateKey);
        
        PoolModifyLiquidityTest router = new PoolModifyLiquidityTest(IPoolManager(poolManager));
        
        MockERC20(token0).mint(vm.addr(deployerPrivateKey), 100_000_000e18);
        MockERC20(token1).mint(vm.addr(deployerPrivateKey), 100_000_000e18);
        
        MockERC20(token0).approve(address(router), type(uint256).max);
        MockERC20(token1).approve(address(router), type(uint256).max);

        // 1. Add MICRO-LIQUIDITY at the floor
        // 1e12 is tiny enough to avoid SafeCastOverflow even at the floor
        router.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -887220, 
                tickUpper: 887220, 
                liquidityDelta: 1e12, 
                salt: bytes32(0)
            }),
            ""
        );

        // 2. Perform micro-recovery swap (ETH -> USDC) to move price up
        address swapRouter = 0xfF9F5F6264C154c701c55A29D3836c60a60db669;
        MockERC20(token1).approve(swapRouter, type(uint256).max); 
        
        PoolSwapTest(swapRouter).swap(
            key,
            SwapParams({
                zeroForOne: false,
                amountSpecified: -1e15, // 0.001 ETH nudge
                sqrtPriceLimitX96: 1461446703485210103287273052203988822378723970341
            }),
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}),
            ""
        );

        vm.stopBroadcast();
        console.log("Pool micro-refilled and price nudged!");
    }
}
