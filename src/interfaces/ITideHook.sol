// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta} from "v4-core/src/types/BeforeSwapDelta.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

/// @title ITideHook
/// @notice Interface for the TideHook dual-market Uniswap v4 hook.
interface ITideHook is IHooks {
    /// @notice Configuration for a specific pool using TideHook
    struct TideConfig {
        uint256 whaleThreshold; // The trade size threshold (in stablecoin/base asset terms)
        uint256 auctionDuration; // Duration of the Dutch auction in blocks (e.g., 300)
        uint24 whaleFeeBps; // Dynamic fee applied to whale orders (e.g., 100 bps = 1%)
        uint24 retailFeeBps; // Fee applied to retail orders (e.g., 30 bps = 0.3%)
    }

    /// @notice State of an active Dutch auction for a large whale order
    struct WhaleAuction {
        address whale;
        PoolId poolId; // The ID of the pool where the auction is taking place
        bool zeroForOne; // Direction of the swap
        uint256 totalAmount; // Total amount the whale wants to swap
        uint256 filledAmount; // Amount that has been executed so far
        uint256 startSqrtPriceX96; // The pool price at the start of the auction
        uint256 priceDecayPerBlock; // Linear price decay parameter
        uint256 startBlock; // Block number when the auction started
        uint256 durationBlocks; // Total expected duration of the auction
        bool active; // Whether the auction is currently running
        bool settled; // Whether the auction has been fully filled and settled
    }

    /// @notice Emitted when a new whale auction begins
    event WhaleAuctionStarted(
        bytes32 indexed auctionId,
        address indexed whale,
        bool zeroForOne,
        uint256 totalAmount,
        uint256 startBlock
    );

    /// @notice Emitted each time an auction executes a partial fill using Reactive Network
    event AuctionTickExecuted(
        bytes32 indexed auctionId,
        uint256 totalFilled,
        uint256 tickPriceSqrtPriceX96,
        uint256 blockNumber
    );

    /// @notice Emitted when a whale auction is fully completed
    event WhaleAuctionCompleted(bytes32 indexed auctionId, uint256 totalFilled);

    /// @notice Used by Reactive Network contracts to advance the state of an active auction.
    /// @param auctionId The unique ID of the auction
    function tickAuction(bytes32 auctionId) external;

    /// @notice Returns the current price for a specific active auction
    /// @param auctionId The unique ID of the auction
    /// @return currentSqrtPriceX96 The calculated price at the current block
    function getAuctionPrice(bytes32 auctionId) external view returns (uint256 currentSqrtPriceX96);

    /// @notice Updates the configuration for a specific pool.
    /// @param poolId The ID of the pool to configure.
    /// @param config The new configuration parameters.
    function setPoolConfig(PoolId poolId, TideConfig calldata config) external;
}
