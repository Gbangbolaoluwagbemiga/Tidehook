// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title AuctionMath
/// @notice Math library for TideHook Dutch auction logic
library AuctionMath {
    /// @dev Calculates the linearly decayed price per block during an active auction.
    /// @param startPriceX96 The initial sqrtPriceX96 at auction start
    /// @param decayPerBlock The amount the price should drop per block
    /// @param elapsedBlocks Number of blocks since the auction started
    /// @param minPriceX96 The floor price the auction cannot decay past
    /// @return currentPriceX96 The decayed price at the current block
    function calculateLinearDecayedPrice(
        uint256 startPriceX96,
        uint256 decayPerBlock,
        uint256 elapsedBlocks,
        uint256 minPriceX96
    ) internal pure returns (uint256 currentPriceX96) {
        uint256 totalDecay = decayPerBlock * elapsedBlocks;
        
        if (totalDecay >= startPriceX96 || (startPriceX96 - totalDecay) < minPriceX96) {
            return minPriceX96;
        }
        
        return startPriceX96 - totalDecay;
    }

    /// @dev Calculates the maximum amount that should be filled at the current block tick.
    /// Given the total amount and auction duration, this calculates a proportional chunk of the order
    /// @param totalAmount The total size of the whale trade
    /// @param durationBlocks Total length of the auction in blocks
    /// @param elapsedBlocks Number of blocks since auction start (cannot exceed duration)
    /// @param previouslyFilled The amount already filled in previous ticks
    /// @return fillAmount The amount to execute at the current tick
    function calculateTickFillAmount(
        uint256 totalAmount,
        uint256 durationBlocks,
        uint256 elapsedBlocks,
        uint256 previouslyFilled
    ) internal pure returns (uint256 fillAmount) {
        if (durationBlocks == 0) return totalAmount - previouslyFilled;
        
        // Cap elapsed blocks to max duration
        uint256 cappedElapsedBlocks = elapsedBlocks > durationBlocks ? durationBlocks : elapsedBlocks;
        
        // Calculate the theoretical total amount that should be filled by now
        uint256 targetTotalFilled = (totalAmount * cappedElapsedBlocks) / durationBlocks;
        
        if (targetTotalFilled > previouslyFilled) {
            return targetTotalFilled - previouslyFilled;
        }
        
        return 0;
    }
}
