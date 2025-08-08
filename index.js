// index.js

require('dotenv').config();
const { ethers } = require('ethers');
const config = require('./config');

// ============================= ABIs =============================
const ROUTER_ABI = ["function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"];
const ERC20_ABI = ["function approve(address spender, uint256 amount) public returns (bool)", "function balanceOf(address account) view returns (uint256)"];
const WSTT_ABI = ["function deposit() payable", "function withdraw(uint256 _amount)"];

// ========================= HELPER FUNCTIONS =========================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomNumber = (min, max) => Math.random() * (max - min) + min;
const getTimestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19);
const log = (message) => console.log(`[${getTimestamp()}] ${message}`);

function isInsufficientFundsError(error) {
    const errorMessage = (error.reason || error.message || '').toLowerCase();
    return errorMessage.includes('insufficient funds') || errorMessage.includes('exceeds balance') || errorMessage.includes('gas required exceeds allowance');
}

// ========================= CORE ACTION LOGIC =========================

/**
 * Executes a swap transaction.
 * @returns {Promise<'SUCCESS'|'INSUFFICIENT_FUNDS'|'FAILURE'>}
 */
async function performSwap(wallet, swapDirection, logPrefix) {
    // ... (This function remains unchanged from the previous version)
    const tokenInAddress = swapDirection === 'PONG_TO_PING' ? config.tokenPongAddress : config.tokenPingAddress;
    const tokenOutAddress = swapDirection === 'PONG_TO_PING' ? config.tokenPingAddress : config.tokenPongAddress;
    const tokenInSymbol = swapDirection === 'PONG_TO_PING' ? 'PONG' : 'PING';
    const tokenOutSymbol = swapDirection === 'PONG_TO_PING' ? 'PING' : 'PONG';
    
    const randomAmount = getRandomNumber(config.minAmountToSwap, config.maxAmountToSwap);
    const amountIn = ethers.parseUnits(randomAmount.toFixed(config.tokenDecimals), config.tokenDecimals);

    log(`${logPrefix} Initiating Swap: ${randomAmount.toFixed(4)} ${tokenInSymbol} -> ${tokenOutSymbol}`);
    try {
        const tokenInContract = new ethers.Contract(tokenInAddress, ERC20_ABI, wallet);
        const routerContract = new ethers.Contract(config.routerAddress, ROUTER_ABI, wallet);
        log(`${logPrefix} Approving router to spend ${tokenInSymbol}...`);
        const approveTx = await tokenInContract.approve(config.routerAddress, amountIn);
        await approveTx.wait();
        log(`${logPrefix} Approval successful.`);
        const params = { tokenIn: tokenInAddress, tokenOut: tokenOutAddress, fee: config.feeTier, recipient: wallet.address, amountIn: amountIn, amountOutMinimum: 0, sqrtPriceLimitX96: 0, };
        log(`${logPrefix} Sending swap transaction...`);
        const swapTx = await routerContract.exactInputSingle(params);
        const swapReceipt = await swapTx.wait();
        log(`✅ ${logPrefix} SWAP SUCCESSFUL! Tx: ${swapReceipt.hash}`);
        return 'SUCCESS';
    } catch (error) {
        if (isInsufficientFundsError(error)) {
            console.error(`🔴 ${logPrefix} SWAP FAILED: Insufficient funds for gas or token. Pausing account.`);
            return 'INSUFFICIENT_FUNDS';
        } else {
            console.error(`❌ ${logPrefix} SWAP FAILED with an unexpected error: ${error.reason || error.message}`);
            return 'FAILURE';
        }
    }
}


/**
 * Wraps a random amount of the native token into WSTT.
 * @returns {Promise<'SUCCESS'|'INSUFFICIENT_FUNDS'|'FAILURE'>}
 */
async function performWrap(wallet, logPrefix) {
    const randomAmount = getRandomNumber(config.minAmountToWrap, config.maxAmountToWrap);
    const amountToWrap = ethers.parseUnits(randomAmount.toFixed(config.tokenDecimals), config.tokenDecimals);

    log(`${logPrefix} Initiating Wrap: ${randomAmount.toFixed(4)} Native -> WSTT`);

    try {
        const wsttContract = new ethers.Contract(config.wsttAddress, WSTT_ABI, wallet);
        const tx = await wsttContract.deposit({ value: amountToWrap });
        const receipt = await tx.wait();
        log(`✅ ${logPrefix} WRAP SUCCESSFUL! Tx: ${receipt.hash}`);
        return 'SUCCESS';
    } catch (error) {
        if (isInsufficientFundsError(error)) {
            console.error(`🔴 ${logPrefix} WRAP FAILED: Insufficient native funds for wrap or gas. Pausing account.`);
            return 'INSUFFICIENT_FUNDS';
        } else {
            console.error(`❌ ${logPrefix} WRAP FAILED with an unexpected error: ${error.reason || error.message}`);
            return 'FAILURE';
        }
    }
}

/**
 * Unwraps a random amount of WSTT back to the native token.
 * @returns {Promise<'SUCCESS'|'INSUFFICIENT_FUNDS'|'FAILURE'>}
 */
async function performUnwrap(wallet, logPrefix) {
    log(`${logPrefix} Initiating Unwrap: WSTT -> Native`);

    try {
        const wsttContract = new ethers.Contract(config.wsttAddress, [...WSTT_ABI, ...ERC20_ABI], wallet);

        // Check WSTT balance first to avoid a guaranteed-to-fail transaction
        const balance = await wsttContract.balanceOf(wallet.address);
        if (balance === 0n) {
            log(`${logPrefix} Unwrap skipped: Account has 0 WSTT. Choosing another action.`);
            return 'FAILURE'; // Treat as failure to force picking a new action immediately
        }
        
        const balanceFormatted = ethers.formatUnits(balance, config.tokenDecimals);
        log(`${logPrefix} Current WSTT Balance: ${balanceFormatted}`);

        const randomAmount = getRandomNumber(config.minAmountToWrap, config.maxAmountToWrap);
        const randomAmountInWei = ethers.parseUnits(randomAmount.toFixed(config.tokenDecimals), config.tokenDecimals);

        // We can only unwrap up to our current balance
        const amountToUnwrap = randomAmountInWei > balance ? balance : randomAmountInWei;
        const amountFormatted = ethers.formatUnits(amountToUnwrap, config.tokenDecimals);
        
        log(`${logPrefix} Attempting to unwrap ${amountFormatted} WSTT...`);

        const tx = await wsttContract.withdraw(amountToUnwrap);
        const receipt = await tx.wait();
        log(`✅ ${logPrefix} UNWRAP SUCCESSFUL! Tx: ${receipt.hash}`);
        return 'SUCCESS';

    } catch (error) {
        if (isInsufficientFundsError(error)) {
            console.error(`🔴 ${logPrefix} UNWRAP FAILED: Insufficient WSTT funds or gas. Pausing account.`);
            return 'INSUFFICIENT_FUNDS';
        } else {
            console.error(`❌ ${logPrefix} UNWRAP FAILED with an unexpected error: ${error.reason || error.message}`);
            return 'FAILURE';
        }
    }
}


// ========================= ACCOUNT WORKER =========================

const AVAILABLE_ACTIONS = ['SWAP_PONG_TO_PING', 'SWAP_PING_TO_PONG', 'WRAP_NATIVE', 'UNWRAP_WSTT'];

/**
 * Manages the continuous action loop for a single account.
 */
async function runForAccount(privateKey, accountIndex) {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const logPrefix = `[Account #${accountIndex + 1} | ${wallet.address.slice(0, 6)}...]`;
    
    log(`${logPrefix} Worker started.`);

    while (true) {
        try {
            // Randomly select one of the four available actions
            const nextAction = AVAILABLE_ACTIONS[Math.floor(Math.random() * AVAILABLE_ACTIONS.length)];
            let status;

            switch (nextAction) {
                case 'SWAP_PONG_TO_PING':
                    status = await performSwap(wallet, 'PONG_TO_PING', logPrefix);
                    break;
                case 'SWAP_PING_TO_PONG':
                    status = await performSwap(wallet, 'PING_TO_PONG', logPrefix);
                    break;
                case 'WRAP_NATIVE':
                    status = await performWrap(wallet, logPrefix);
                    break;
                case 'UNWRAP_WSTT':
                    status = await performUnwrap(wallet, logPrefix);
                    break;
            }

            let delaySeconds;
            if (status === 'SUCCESS') {
                delaySeconds = getRandomNumber(config.minDelaySeconds, config.maxDelaySeconds);
                log(`${logPrefix} Action successful. Next action in ~${(delaySeconds / 60).toFixed(1)} minutes.`);
                await sleep(delaySeconds * 1000);
            } else if (status === 'INSUFFICIENT_FUNDS') {
                delaySeconds = config.longDelayHours * 3600;
                log(`${logPrefix} Pausing for ${config.longDelayHours} hours due to insufficient funds.`);
                await sleep(delaySeconds * 1000);
            } else { // 'FAILURE' or any other case
                // If an action fails for a reason other than funds (e.g., trying to unwrap 0 WSTT),
                // we just wait a very short time and immediately try a *different* random action.
                log(`${logPrefix} Action failed or was skipped. Trying another action shortly...`);
                await sleep(5000); // Wait 5 seconds before next attempt
            }

        } catch (e) {
            log(`CRITICAL ERROR in worker loop for ${logPrefix}. Restarting loop after 1 minute. Error: ${e.message}`);
            await sleep(300000);
        }
    }
}

// ========================= MAIN ENTRY POINT =========================
function main() {
    log("Starting 'SWAP SOMNIA' Multi-Account Bot with Wrap/Unwrap...");

    const privateKeys = process.env.PRIVATE_KEYS ? process.env.PRIVATE_KEYS.split(',') : [];
    if (privateKeys.length === 0 || !privateKeys[0]) {
        console.error("FATAL ERROR: No PRIVATE_KEYS found in the .env file. Please check your configuration.");
        return;
    }

    log(`Found ${privateKeys.length} account(s) to process.`);
    console.log('------------------------------------------------------------------');

    privateKeys.forEach((pk, index) => {
        runForAccount(pk.trim(), index).catch(error => {
            console.error(`FATAL ERROR in worker for Account #${index + 1}. The worker has stopped. Error:`, error);
        });
    });
}

main();