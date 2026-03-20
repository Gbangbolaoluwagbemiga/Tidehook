// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {TideHook} from "../src/TideHook.sol";

contract VerifyFlow is Script {
    using PoolIdLibrary for PoolKey;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address poolManager = 0x59Df08019Efcbe82bB35d6888F0Df28b97950c00;
        address hookAddress = 0xF2C8a4F509B2b97f4664848f1AF5166E9c4290c8;
        address tokenUSDC = 0x800131A94588a79dEC1E317B6B3E3f9F92684930;
        address tokenETH = 0x6a4be55c36495c0203464b6504F95E42d7E76fC1;

        TideHook hook = TideHook(hookAddress);
        MockERC20 usdc = MockERC20(tokenUSDC);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(tokenETH < tokenUSDC ? tokenETH : tokenUSDC),
            currency1: Currency.wrap(tokenETH < tokenUSDC ? tokenUSDC : tokenETH),
            fee: 0x800000,
            tickSpacing: 60,
            hooks: IHooks(hookAddress)
        });

        vm.startBroadcast(deployerPrivateKey);

        // 1. Approve Hook for USDC
        uint256 whaleAmount = 50_000_000 * 1e18; // 50M USDC
        usdc.approve(hookAddress, whaleAmount);
        console.log("Approved Hook for USDC.");

        // 2. Trigger Whale Auction
        // zeroForOne = false (Selling USDC [Currency1] for ETH [Currency0])
        hook.initiateWhaleAuction(key, false, whaleAmount);
        console.log("Triggered Whale Auction!");

        vm.stopBroadcast();
    }
}
