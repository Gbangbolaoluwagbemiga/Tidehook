// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";
import {TideHook} from "../src/TideHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";

contract MineSalt is Script {
    function run() external {
        address deployer = 0x4e59b44847b379578588920cA78FbF26c0B4956C; // CREATE2 Deployer Proxy
        
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );

        // Dummy constructor args for mining (address of manager, address of reactive relayer)
        // Note: The actual addresses for deployment should be used here to match bytecode
        address poolManager = vm.envAddress("POOL_MANAGER");
        address reactiveNetwork = 0xdee8489FFfdB8Ce1643ecD508Ce1ca48575D4f31; // Predicted address

        bytes memory constructorArgs = abi.encode(poolManager, reactiveNetwork);
        
        console.log("Mining salt for flags: 0x%s", vm.toString(flags));
        
        (address hookAddress, bytes32 salt) = HookMiner.find(
            deployer,
            flags,
            type(TideHook).creationCode,
            constructorArgs
        );
        
        console.log("Found salt:", vm.toString(salt));
        console.log("Predicted hook address:", hookAddress);
    }
}
