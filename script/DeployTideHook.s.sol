// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {TideHook} from "../src/TideHook.sol";

contract DeployTideHook is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envAddress("POOL_MANAGER");
        
        // Use the address of the reactive network contract if already deployed, 
        // or a placeholder if deploying in parallel/test
        address reactiveNetwork = 0xdee8489FFfdB8Ce1643ecD508Ce1ca48575D4f31;

        vm.startBroadcast(deployerPrivateKey);

        // Mined Salt for 0x10c8 bits with predicted reactive address
        bytes32 salt = 0x00000000000000000000000000000000000000000000000000000000000000b1;

        TideHook hook = new TideHook{salt: salt}(
            IPoolManager(poolManager),
            reactiveNetwork
        );

        console.log("TideHook deployed at:", address(hook));

        vm.stopBroadcast();
    }
}
