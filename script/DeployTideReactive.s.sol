// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "forge-std/Script.sol";
import {TideReactive} from "../reactive/TideReactive.sol";

contract DeployTideReactive is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hookTarget = 0x1F6D39d3a463097b179c4fa147767139B86290C8; // Predicted address

        vm.startBroadcast(deployerPrivateKey);

        TideReactive reactive = new TideReactive(hookTarget);

        console.log("TideReactive deployed on Reactive Network at:", address(reactive));

        vm.stopBroadcast();
    }
}
