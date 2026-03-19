// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {MockERC20} from "solmate/src/test/utils/mocks/MockERC20.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {TideHook} from "../src/TideHook.sol";
import {ITideHook} from "../src/interfaces/ITideHook.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

contract DeployE2E is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    bytes constant ZERO_BYTES = new bytes(0);

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        address userAddress = 0x3Be7fbBDbC73Fc4731D60EF09c4BA1A94DC58E41; // The user's wallet

        vm.startBroadcast(deployerPrivateKey);

        // 1. We assume PoolManager is already deployed on Testnet or we deploy it.
        // Unichain Sepolia officially has a PoolManager at 0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f but maybe we just deploy our own test suite so we have full control over routers.
        IPoolManager manager = new PoolManager(deployerAddress);
        console.log("Deployed PoolManager:", address(manager));

        // 2. Deploy Routers
        PoolSwapTest swapRouter = new PoolSwapTest(manager);
        console.log("Deployed PoolSwapTest:", address(swapRouter));

        PoolModifyLiquidityTest modifyLiquidityRouter = new PoolModifyLiquidityTest(manager);
        console.log("Deployed PoolModifyLiquidityTest:", address(modifyLiquidityRouter));

        // 3. Deploy Mock Tokens
        MockERC20 token0 = new MockERC20("Mock USDC", "USDC", 18);
        MockERC20 token1 = new MockERC20("Mock ETH", "ETH", 18);
        console.log("Deployed Token0 (USDC):", address(token0));
        console.log("Deployed Token1 (ETH):", address(token1));

        // Ensure token0 < token1 to form a valid Currency pair
        Currency currency0;
        Currency currency1;
        if (address(token0) < address(token1)) {
            currency0 = Currency.wrap(address(token0));
            currency1 = Currency.wrap(address(token1));
        } else {
            currency0 = Currency.wrap(address(token1));
            currency1 = Currency.wrap(address(token0));
        }

        // 4. Mint huge amounts to deployer to add liquidity
        uint256 initialLiquidity = 100_000_000e18;
        token0.mint(deployerAddress, initialLiquidity);
        token1.mint(deployerAddress, initialLiquidity);

        // 5. Mint 1 billion tokens to the user's address
        uint256 userAmount = 1_000_000_000e18;
        token0.mint(userAddress, userAmount);
        token1.mint(userAddress, userAmount);
        console.log("Minted 1 Billion mock tokens to user:", userAddress);

        // Deploy the Hook
        address REACTIVE_NETWORK = deployerAddress; // set to deployer so we can simulate it locally
        
        // Mine salt
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG |
            Hooks.BEFORE_SWAP_FLAG |
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_SWAP_RETURNS_DELTA_FLAG
        );
        
        (address hookAddress, bytes32 salt) = HookMiner.find(
            0x4e59b44847b379578588920cA78FbF26c0B4956C, // standard CREATE2 factory
            flags,
            type(TideHook).creationCode,
            abi.encode(manager, REACTIVE_NETWORK)
        );
        
        TideHook hook = new TideHook{salt: salt}(manager, REACTIVE_NETWORK);
        console.log("Deployed Hook at:", address(hook));

        // Initialize Pool
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        
        // Start Price 1:1 (sqrt(1) * 2^96 = 79228162514264337593543950336)
        manager.initialize(key, 79228162514264337593543950336);
        console.log("Pool initialized with Hook");

        // Config TideHook
        hook.setPoolConfig(key.toId(), ITideHook.TideConfig({
            whaleThreshold: 500_000 * 10**18,
            auctionDuration: 300,
            whaleFeeBps: 100,
            retailFeeBps: 30
        }));
        console.log("TideHook configured for pool");

        // Add Liquidity
        token0.approve(address(modifyLiquidityRouter), initialLiquidity);
        token1.approve(address(modifyLiquidityRouter), initialLiquidity);

        modifyLiquidityRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: -600,
                tickUpper: 600,
                liquidityDelta: 10_000_000e18,
                salt: bytes32(0)
            }),
            ZERO_BYTES
        );
        console.log("Added 10M deep liquidity to pool");

        vm.stopBroadcast();
    }
}
