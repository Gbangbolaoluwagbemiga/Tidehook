// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IERC20Minimal} from "v4-core/src/interfaces/external/IERC20Minimal.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";

// V4 Peripheral deploys
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";

import {TideHook} from "../src/TideHook.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";

contract TideHookTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using StateLibrary for IPoolManager;

    TideHook hook;
    PoolId poolId;
    address constant REACTIVE_NETWORK = address(0x12345);

    function setUp() public {
        // Creates the pool manager, test routers, and tokens in Deployers
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();

        // Deploy Hook to an address with the required flags
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );
        address hookAddress = address(flags);

        deployCodeTo("TideHook", abi.encode(manager, REACTIVE_NETWORK), hookAddress);
        hook = TideHook(hookAddress);

        // Initialize a DYNAMIC FEE pool with our hook
        // PoolKey: (currency0, currency1, fee, tickSpacing, hooks)
        (key, poolId) = initPool(currency0, currency1, hook, LPFeeLibrary.DYNAMIC_FEE_FLAG, SQRT_PRICE_1_1);

        // Add deep liquidity so price limits aren't hit during unit tests
        modifyLiquidityRouter.modifyLiquidity(
            key,
            IPoolManager.ModifyLiquidityParams({
                tickLower: -600,
                tickUpper: 600,
                liquidityDelta: 10_000_000e18,
                salt: bytes32(0)
            }),
            ZERO_BYTES
        );
    }

    function test_RetailSwapNormalExecution() public {
        // Swap 10,000 tokens (well below the 500k threshold)
        uint256 swapAmount = 10_000e18;

        bool zeroForOne = true;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(swapAmount),
            sqrtPriceLimitX96: zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT
        });

        uint256 prevBalance = currency1.balanceOfSelf();

        // Perform swap
        swapRouter.swap(key, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);

        uint256 newBalance = currency1.balanceOfSelf();
        
        // Assert retail success (balance increased logically)
        assertTrue(newBalance > prevBalance, "Retail swap failed to return tokens");
    }

    function test_WhaleSwapInitiatesAuction() public {
        // Default whale threshold is 500,000e18 in TideHook.sol refactor
        // Swap 600,000 tokens (triggers whale threshold)
        uint256 swapAmount = 600_000e18;

        bool zeroForOne = true;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -int256(swapAmount),
            sqrtPriceLimitX96: zeroForOne ? MIN_PRICE_LIMIT : MAX_PRICE_LIMIT
        });

        // The SwapRouter should not actually process the standard path because
        // the hook returns a BeforeSwapDelta that cancels the core swap loop.
        swapRouter.swap(key, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);

        // Calculate expected Auction ID (nonce 1)
        bytes32 expectedAuctionId = keccak256(abi.encodePacked(poolId, uint256(1), block.timestamp));

        // Fetch auction from hook
        (
            address whale,
            PoolId pId,
            bool zfo,
            uint256 totalAmt,
            uint256 filled,
            uint256 startPrice,
            uint256 priceDecay,
            uint256 startBlock,
            uint256 durationBlocks,
            bool active,
            bool settled
        ) = hook.auctions(expectedAuctionId);

        // Assert auction state was successfully built
        assertTrue(active, "Auction should be active");
        assertFalse(settled, "Auction should not be settled");
        assertEq(whale, address(swapRouter), "Mismatch whale address"); // The swapRouter is the caller of the hook
        assertEq(PoolId.unwrap(pId), PoolId.unwrap(poolId), "Mismatch poolId");
        assertEq(totalAmt, swapAmount, "Mismatch absolute swapped amount");
        assertEq(zfo, zeroForOne, "Mismatch zeroForOne");
        assertEq(startBlock, block.number, "Mismatch start block");
        assertEq(durationBlocks, 300, "Mismatch configuration duration blocks");
        assertEq(filled, 0, "Initial filled amount should be 0");
    }

    function test_TickRevertsIfNotReactiveNetwork() public {
        uint256 swapAmount = 600_000e18;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: -int256(swapAmount),
            sqrtPriceLimitX96: MIN_PRICE_LIMIT
        });
        swapRouter.swap(key, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        
        bytes32 auctionId = keccak256(abi.encodePacked(poolId, uint256(1), block.timestamp));

        // Expect revert when anon calls tick
        vm.expectRevert("TideHook: Caller is not Reactive Network");
        hook.tickAuction(auctionId);
    }

    function test_WhaleAuctionPriceDecay() public {
        uint256 swapAmount = 600_000e18;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: -int256(swapAmount),
            sqrtPriceLimitX96: MIN_PRICE_LIMIT
        });
        swapRouter.swap(key, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        
        bytes32 auctionId = keccak256(abi.encodePacked(poolId, uint256(1), block.timestamp));

        // Read initial auction details
        // Read initial auction details
        (,,,,, uint256 startPriceX96,,,,,) = hook.auctions(auctionId);
        
        // Initial price should equal 0 decay
        uint256 price0 = hook.getAuctionPrice(auctionId);
        assertEq(price0, startPriceX96, "Initial price mismatch");

        // Advance 10 blocks
        vm.roll(block.number + 10);
        
        // Price should be lower (decayed)
        uint256 priceAfter10 = hook.getAuctionPrice(auctionId);
        assertTrue(priceAfter10 < startPriceX96, "Price did not decay over 10 blocks");

        uint256 whaleBalanceBefore = currency1.balanceOf(address(swapRouter));

        // Assert tick execution advances filledAmount via Reactive
        vm.prank(REACTIVE_NETWORK);
        hook.tickAuction(auctionId);

        (,,,, uint256 filledAfterTick,,,,,,) = hook.auctions(auctionId);
        
        // At block 10/300 duration, filled should be 1/30 of total
        // 600k * (10/300) = 20k
        assertApproxEqAbs(filledAfterTick, 20_000e18, 1e18, "Filled math chunk invalid");

        uint256 whaleBalanceAfter = currency1.balanceOf(address(swapRouter));
        assertTrue(whaleBalanceAfter > whaleBalanceBefore, "Whale should receive tokens after tick");
    }

    function test_AuctionSettlesProperlyAtFullDuration() public {
        uint256 swapAmount = 600_000e18;
        IPoolManager.SwapParams memory params = IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: -int256(swapAmount),
            sqrtPriceLimitX96: MIN_PRICE_LIMIT
        });
        swapRouter.swap(key, params, PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        bytes32 auctionId = keccak256(abi.encodePacked(poolId, uint256(1), block.timestamp));

        // Fast forward beyond max duration
        vm.roll(block.number + 350); 
        
        uint256 whaleBalanceBefore = currency1.balanceOf(address(swapRouter));

        vm.prank(REACTIVE_NETWORK);
        hook.tickAuction(auctionId);

        // Fetch state
        (,,,,uint256 filledAfterFinalTick,,,,,bool active, bool settled) = hook.auctions(auctionId);
        
        // Assert complete properties
        assertEq(filledAfterFinalTick, swapAmount, "Should be fully filled");
        assertFalse(active, "Auction should deactivate");
        assertTrue(settled, "Auction should be settled");

        uint256 whaleBalanceAfter = currency1.balanceOf(address(swapRouter));
        assertTrue(whaleBalanceAfter > whaleBalanceBefore, "Whale should receive all tokens after settlement");
    }

    function test_MultipleConcurrentWhaleAuctions() public {
        uint256 startTimestamp = 1000;
        vm.warp(startTimestamp);

        uint256 swapAmountA = 600_000e18;
        uint256 swapAmountB = 800_000e18;
        address whaleB = address(0x999);

        // Whale A initiates (ZeroForOne)
        swapRouter.swap(key, IPoolManager.SwapParams({
            zeroForOne: true,
            amountSpecified: -int256(swapAmountA),
            sqrtPriceLimitX96: MIN_PRICE_LIMIT
        }), PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        bytes32 idA = keccak256(abi.encodePacked(poolId, uint256(1), startTimestamp));

        // Whale B initiates (OneForZero - different direction to avoid any price limit overlap in mock environment)
        vm.warp(startTimestamp + 1);
        vm.prank(whaleB);
        IERC20Minimal(Currency.unwrap(currency1)).approve(address(swapRouter), swapAmountB);
        swapRouter.swap(key, IPoolManager.SwapParams({
            zeroForOne: false,
            amountSpecified: -int256(swapAmountB),
            sqrtPriceLimitX96: MAX_PRICE_LIMIT
        }), PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false}), ZERO_BYTES);
        bytes32 idB = keccak256(abi.encodePacked(poolId, uint256(2), startTimestamp + 1));

        // Advance 10 blocks
        vm.roll(block.number + 10);

        // Tick both
        vm.startPrank(REACTIVE_NETWORK);
        hook.tickAuction(idA);
        hook.tickAuction(idB);
        vm.stopPrank();

        (,,,,uint256 filledA,,,,,,) = hook.auctions(idA);
        (,,,,uint256 filledB,,,,,,) = hook.auctions(idB);

        assertApproxEqAbs(filledA, 20_000e18, 1e18); // 600k * 10/300
        assertApproxEqAbs(filledB, 26_666e18, 1e18); // 800k * 10/300
        assertTrue(idA != idB, "Auction IDs must be unique");
    }
}
