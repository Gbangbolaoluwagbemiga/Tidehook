// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {IUnlockCallback} from "v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary, toBeforeSwapDelta} from "v4-core/src/types/BeforeSwapDelta.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {StateLibrary} from "v4-core/src/libraries/StateLibrary.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {ITideHook} from "./interfaces/ITideHook.sol";
import {AuctionMath} from "./libraries/AuctionMath.sol";
import "forge-std/console.sol";

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

/// @title TideHook
/// @notice Dual-market Uniswap v4 hook routing retail orders normally and placing whale orders into Dutch auctions.
contract TideHook is BaseHook, ITideHook, IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    using LPFeeLibrary for uint24;
    using StateLibrary for IPoolManager;
    using CurrencyLibrary for Currency;

    /// @notice Maps a PoolId to its specific configuration
    mapping(PoolId => TideConfig) public poolConfigs;

    /// @notice Maps a PoolId to its PoolKey (needed for unlockCallback)
    mapping(PoolId => PoolKey) public poolKeys;

    /// @notice Maps an auction ID to the auction state struct
    mapping(bytes32 => WhaleAuction) public auctions;

    /// @notice Data passed to the unlock callback for whale auction settlement
    struct WhaleAuctionSettleData {
        bytes32 auctionId;
        PoolId poolId;
        uint256 amountToFill;
        uint256 priceLimitX96;
    }

    /// @notice Internal counter for generating unique auction IDs per pool
    mapping(PoolId => uint256) private _auctionNonce;

    /// @notice The address of the Reactive Network smart contract allowed to trigger ticks
    address public immutable reactiveNetwork;

    modifier onlyReactiveNetwork() {
        require(msg.sender == reactiveNetwork, "TideHook: Caller is not Reactive Network");
        _;
    }

    constructor(IPoolManager _poolManager, address _reactiveNetwork) BaseHook(_poolManager) {
        reactiveNetwork = _reactiveNetwork;
    }

    /// @dev Return the hook permissions set
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: true,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ---------------------------------------------------------
    // Hook Implementations
    // ---------------------------------------------------------

    /// @notice afterInitialize hook implementation. Sets default pool configurations
    function _afterInitialize(
        address /* sender */,
        PoolKey calldata key,
        uint160 /* sqrtPriceX96 */,
        int24 /* tick */
    ) internal override returns (bytes4) {
        PoolId poolId = key.toId();
        poolKeys[poolId] = key;

        // Default Demo Configuration
        poolConfigs[poolId] = TideConfig({
            whaleThreshold: 500_000e18, 
            auctionDuration: 300,      
            whaleFeeBps: 100,          
            retailFeeBps: 30           
        });

        return BaseHook.afterInitialize.selector;
    }

    /// @notice beforeSwap hook implementation. Routes retail and whale orders
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata /* hookData */
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        PoolId poolId = key.toId();
        TideConfig memory config = poolConfigs[poolId];
        
        uint256 absAmount = params.amountSpecified < 0 
            ? uint256(-params.amountSpecified) 
            : uint256(params.amountSpecified);

        // Standard Retail pass-through
        if (sender == address(this) || absAmount < config.whaleThreshold) {
            // Assign retail dynamic fee 
            return (
                BaseHook.beforeSwap.selector,
                BeforeSwapDeltaLibrary.ZERO_DELTA,
                config.retailFeeBps | LPFeeLibrary.OVERRIDE_FEE_FLAG
            );
        }

        // WHALE DETECTED: Revert to protect against massive AMM slippage.
        // Whales must use the `initiateWhaleAuction` Native Router directly!
        revert("TideHook: Whale orders must use initiateWhaleAuction()");
    }

    /// @notice afterSwap hook implementation.
    function _afterSwap(
        address /* sender */,
        PoolKey calldata /* key */,
        SwapParams calldata /* params */,
        BalanceDelta /* delta */,
        bytes calldata /* hookData */
    ) internal pure override returns (bytes4, int128) {
        return (BaseHook.afterSwap.selector, 0);
    }

    /// @notice Native Router function for Whales to initiate a Dutch Auction securely.
    /// @dev Pulls funds directly from the whale into the hook. Bypasses the AMM router.
    function initiateWhaleAuction(
        PoolKey calldata key,
        bool zeroForOne,
        uint256 amount
    ) external {
        PoolId poolId = key.toId();
        TideConfig memory config = poolConfigs[poolId];
        
        require(amount >= config.whaleThreshold, "TideHook: Amount below whale threshold");

        // Robustness fix: Ensure hook knows the PoolKey even if initialization was missed
        if (Currency.unwrap(poolKeys[poolId].currency0) == address(0)) {
            poolKeys[poolId] = key;
        }

        // 1. Pull the tokens natively into the hook context (bypassing PoolManager credits)
        address token = zeroForOne ? Currency.unwrap(key.currency0) : Currency.unwrap(key.currency1);
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "TideHook: Native Token transfer failed");

        // 2. Initialize the auction parameters
        (uint160 currentSqrtPriceX96,,,) = poolManager.getSlot0(poolId);

        _initiateWhaleAuction(
            poolId,
            msg.sender, // The Whale is the caller
            zeroForOne,
            amount,
            currentSqrtPriceX96,
            config.auctionDuration
        );
    }

    /// @notice The unlock callback for the hook. Executes the actual swap slice.
    function unlockCallback(bytes calldata data) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only poolManager");
        
        WhaleAuctionSettleData memory settleData = abi.decode(data, (WhaleAuctionSettleData));
        WhaleAuction storage auction = auctions[settleData.auctionId];
        PoolKey memory key = poolKeys[settleData.poolId];

        // 1. Core Swap Execution
        // We use the hook's claims (input currency) to pay for the swap.
        // The output tokens are taken and sent to the whale.
        
        SwapParams memory params = SwapParams({
            zeroForOne: auction.zeroForOne,
            amountSpecified: -int256(settleData.amountToFill),
            sqrtPriceLimitX96: uint160(settleData.priceLimitX96)
        });

        // Execute actual V4 swap
        BalanceDelta delta = poolManager.swap(key, params, "");

        // 2. Settle the swap results
        Currency inputCurrency = auction.zeroForOne ? key.currency0 : key.currency1;
        Currency outputCurrency = auction.zeroForOne ? key.currency1 : key.currency0;

        // Hook pays the input amount by sending its securely held ERC20 tokens to the manager
        // and calling settle() to clear the negative delta.
        uint256 inputOwed = auction.zeroForOne ? uint256(int256(-delta.amount0())) : uint256(int256(-delta.amount1()));
        
        address inputToken = Currency.unwrap(inputCurrency);
        poolManager.sync(inputCurrency);
        IERC20(inputToken).transfer(address(poolManager), inputOwed);
        poolManager.settle();

        // Hook takes the output amount from the manager and sends to whale
        uint256 outputGained = auction.zeroForOne ? uint256(int256(delta.amount1())) : uint256(int256(delta.amount0()));
        poolManager.take(outputCurrency, auction.whale, outputGained);

        return "";
    }


    // ---------------------------------------------------------
    // Core Whale Auction Engine
    // ---------------------------------------------------------

    /// @notice Internal initialization of the whale auction
    function _initiateWhaleAuction(
        PoolId poolId,
        address whale,
        bool zeroForOne,
        uint256 totalAmount,
        uint256 currentSqrtPriceX96,
        uint256 durationBlocks
    ) internal {
        _auctionNonce[poolId]++;
        bytes32 auctionId = keccak256(abi.encodePacked(poolId, _auctionNonce[poolId], block.timestamp));

        // Simplified price decay: decays by total 5% over the auction lifetime
        uint256 minPriceX96 = (uint256(currentSqrtPriceX96) * 95) / 100;
        uint256 totalDecayAmount = uint256(currentSqrtPriceX96) - minPriceX96;
        uint256 decayPerBlock = totalDecayAmount / durationBlocks;

        auctions[auctionId] = WhaleAuction({
            whale: whale,
            poolId: poolId,
            zeroForOne: zeroForOne,
            totalAmount: totalAmount,
            filledAmount: 0,
            startSqrtPriceX96: currentSqrtPriceX96,
            priceDecayPerBlock: decayPerBlock,
            startBlock: block.number,
            durationBlocks: durationBlocks,
            active: true,
            settled: false
        });

        emit WhaleAuctionStarted(auctionId, whale, zeroForOne, totalAmount, block.number);
    }

    /// @inheritdoc ITideHook
    function setPoolConfig(PoolId poolId, TideConfig calldata config) external {
        // In a production environment, we would check if msg.sender is the pool creator
        // or has admin rights. For the demo, we allow anyone to configure.
        poolConfigs[poolId] = config;
    }

    /// @inheritdoc ITideHook
    function tickAuction(bytes32 auctionId) external override onlyReactiveNetwork {
        WhaleAuction storage auction = auctions[auctionId];
        require(auction.active, "TideHook: Auction not active");
        require(!auction.settled, "TideHook: Auction already settled");

        uint256 elapsedBlocks = block.number - auction.startBlock;
        
        // Find chunk to fill
        uint256 chunkToFill = AuctionMath.calculateTickFillAmount(
            auction.totalAmount, 
            auction.durationBlocks, 
            elapsedBlocks, 
            auction.filledAmount
        );

        if (chunkToFill == 0 && elapsedBlocks < auction.durationBlocks) {
            return; // Nothing to fill on this tick yet, auction still ongoing
        }

        uint256 currentPriceX96 = getAuctionPrice(auctionId);
        
        // Trigger actual swap via unlock
        poolManager.unlock(
            abi.encode(
                WhaleAuctionSettleData({
                    auctionId: auctionId,
                    poolId: auction.poolId,
                    amountToFill: chunkToFill,
                    priceLimitX96: auction.zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
                })
            )
        );

        auction.filledAmount += chunkToFill;
        
        emit AuctionTickExecuted(auctionId, auction.filledAmount, currentPriceX96, block.number);

        // Check for settlement
        if (auction.filledAmount >= auction.totalAmount) {
            auction.active = false;
            auction.settled = true;
            emit WhaleAuctionCompleted(auctionId, auction.filledAmount);
        }
    }

    /// @inheritdoc ITideHook
    function getAuctionPrice(bytes32 auctionId) public view override returns (uint256 currentSqrtPriceX96) {
        WhaleAuction memory auction = auctions[auctionId];
        require(auction.startBlock > 0, "TideHook: Invalid auction ID");

        uint256 elapsedBlocks = block.number - auction.startBlock;
        uint256 minPriceX96 = (auction.startSqrtPriceX96 * 95) / 100; 

        return AuctionMath.calculateLinearDecayedPrice(
            auction.startSqrtPriceX96,
            auction.priceDecayPerBlock,
            elapsedBlocks,
            minPriceX96
        );
    }
}
