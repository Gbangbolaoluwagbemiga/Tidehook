// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";

contract ConfigurePool is Script {
    using PoolIdLibrary for PoolKey;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hookAddress = 0xd77D684E1D395ee75Ad9e700976Ddd34019f50c8;
        
        address token0 = 0x5516ED31121939B59037da63a9335daD8436Ec56; // USDC
        address token1 = 0xA6561D33351C0211bB57e73990E4378b9E2b93D8; // ETH
        
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0 < token1 ? token0 : token1),
            currency1: Currency.wrap(token0 < token1 ? token1 : token0),
            fee: 0x800000, // DYNAMIC_FEE_FLAG
            tickSpacing: 60,
            hooks: ITideHook(hookAddress)
        });
        
        PoolId poolId = key.toId();
        
        ITideHook.TideConfig memory config = ITideHook.TideConfig({
            whaleThreshold: 500_000 * 10**18, // 500k USDC
            auctionDuration: 300,             // 300 blocks
            whaleFeeBps: 100,                 // 1%
            retailFeeBps: 30                  // 0.3%
        });
        
        vm.startBroadcast(deployerPrivateKey);
        ITideHook(hookAddress).setPoolConfig(poolId, config);
        vm.stopBroadcast();
        
        console.log("Pool configured successfully for ID:", vm.toString(PoolId.unwrap(poolId)));
    }
}
