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
        address hookAddress = 0xeD8c3B0437C4E0723a0C34719a0E7AD6698bd0C8;
        address poolManager = 0x66f14169E3224Fcc80273867a7E6b77915718Aa3;
        
        address token0 = 0x115603bD919aCE06804a280437bD3a560131F1f3; // USDC
        address token1 = 0xf953E252cb5080c9361F62A5fD081F83A768eb5F; // ETH

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0 < token1 ? token0 : token1),
            currency1: Currency.wrap(token0 < token1 ? token1 : token0),
            fee: 0x800000, 
            tickSpacing: 120,
            hooks: IHooks(hookAddress)
        });

        vm.startBroadcast(deployerPrivateKey);
        
        PoolModifyLiquidityTest router = new PoolModifyLiquidityTest(IPoolManager(poolManager));
        
        // Initialize the new pool variant
        uint160 startingPrice = 79228162514264337593543950336; // 1:1 price
        IPoolManager(poolManager).initialize(key, startingPrice);
        
        MockERC20(token0).mint(vm.addr(deployerPrivateKey), 100_000_000e18);
        MockERC20(token1).mint(vm.addr(deployerPrivateKey), 100_000_000e18);
        
        MockERC20(token0).approve(address(router), type(uint256).max);
        MockERC20(token1).approve(address(router), type(uint256).max);

        // 1. Add normal liquidity to the new symmetric pool
        router.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -120 * 100, // Safe bounds for 120 spacing
                tickUpper: 120 * 100, 
                liquidityDelta: 10_000_000e18, // Provide plenty of depth for the demo!
                salt: bytes32(0)
            }),
            ""
        );

        vm.stopBroadcast();
        console.log("Pool micro-refilled and price nudged!");
    }
}
