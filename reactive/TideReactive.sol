// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @title ITideHook Callable Interface
interface IHookTarget {
    function tickAuction(bytes32 auctionId) external;
}

/// @title TideReactive
/// @notice Reactive Network smart contract mimicking the subscriber logic 
///         that listens for the `WhaleAuctionStarted` event and triggers the callback
contract TideReactive {
    // Standard Reactive Network interface abstractions
    uint256 private constant TICK_INTERVAL_BLOCKS = 5;

    // The deployed TideHook address on the destination chain (e.g. Unichain)
    address public immutable hookTarget;
    address public owner;

    // Active auctions being tracked by Reactive
    mapping(bytes32 => bool) public activeAuctions;
    mapping(bytes32 => uint256) public lastTickBlock;

    event Subscribed(address indexed hookAddress);
    event TickSent(bytes32 indexed auctionId, uint256 currentBlock);

    constructor(address _hookTarget) {
        hookTarget = _hookTarget;
        owner = msg.sender;
        emit Subscribed(_hookTarget);
    }

    /// @notice Simulates Reactive intercepting the `WhaleAuctionStarted` log.
    /// @dev Called automatically by the Reactive Node when log is emitted on destination chain
    function reactAuctionStarted(bytes32 auctionId, uint256 startBlock) external {
        // Assume verified caller is Reactive Node infrastructure
        require(!activeAuctions[auctionId], "Already tracking auction");

        activeAuctions[auctionId] = true;
        lastTickBlock[auctionId] = startBlock;
    }

    /// @notice Periodically evaluated by Reactive Node to fire transactions on the destination chain
    /// @dev Evaluates whether TICK_INTERVAL_BLOCKS have passed to trigger `tickAuction`
    function evaluateTick(bytes32 auctionId, uint256 currentDestinationBlock) external {
        require(activeAuctions[auctionId], "Auction not tracked");

        if (currentDestinationBlock >= lastTickBlock[auctionId] + TICK_INTERVAL_BLOCKS) {
            // FIRE destination chain transaction to hookTarget `tickAuction`
            // (Abstracted cross-chain call matching Reactive Network architecture)
            
            // In an actual Reactive contract, this emits an execution intent.
            // For Demo/Tests, we fire directly locally.
            IHookTarget(hookTarget).tickAuction(auctionId);
            
            lastTickBlock[auctionId] = currentDestinationBlock;
            emit TickSent(auctionId, currentDestinationBlock);
        }
    }

    /// @notice Reactive node intercepting `WhaleAuctionCompleted` to stop tracking
    function reactAuctionSettled(bytes32 auctionId) external {
        if (activeAuctions[auctionId]) {
            activeAuctions[auctionId] = false;
        }
    }
}
