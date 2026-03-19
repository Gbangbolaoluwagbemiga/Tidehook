// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";

contract TickAuction is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address hookAddress = vm.envAddress("HOOK_ADDRESS");
        bytes32 auctionId = vm.envBytes32("AUCTION_ID");
        
        console.log("Ticking Auction:", vm.toString(auctionId));
        console.log("On Hook:", hookAddress);
        
        vm.startBroadcast(deployerPrivateKey);
        ITideHook(hookAddress).tickAuction(auctionId);
        vm.stopBroadcast();
        
        console.log("Tick executed successfully!");
    }
}
