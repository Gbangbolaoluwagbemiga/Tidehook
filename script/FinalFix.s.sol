// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";

contract FinalFix is Script {
    using PoolIdLibrary for PoolKey;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hookAddress = 0xd77D684E1D395ee75Ad9e700976Ddd34019f50c8;
        
        // These are the "OLD" tokens the user is actually using in the UI!
        address token0 = 0x80eEaE08a46eF968Ba85e1862FCfE37072981a34; // USDC
        address token1 = 0xA07f578857c52674493953F7CAF119e9D29e36B7; // ETH
        
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0 < token1 ? token0 : token1),
            currency1: Currency.wrap(token0 < token1 ? token1 : token0),
            fee: 0x800000, // DYNAMIC_FEE_FLAG
            tickSpacing: 60,
            hooks: ITideHook(hookAddress)
        });
        
        PoolId poolId = key.toId();
        
        // 1. Configure the pool correctly
        ITideHook.TideConfig memory config = ITideHook.TideConfig({
            whaleThreshold: 500_000 * 10**18, 
            auctionDuration: 300,             
            whaleFeeBps: 100,                 
            retailFeeBps: 30                  
        });
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Ensure Hook knows about configuration
        ITideHook(hookAddress).setPoolConfig(poolId, config);
        
        // MANUALLY TRIGGER TICK for the active auction!
        bytes32 auctionId = 0x52051afe73643e441345824c7548bb34257df0c23716fc017f7a42f16b0eaeed;
        ITideHook(hookAddress).tickAuction(auctionId);
        
        vm.stopBroadcast();
        
        console.log("Hook reconfigured and Auction Ticked!");
    }
}
