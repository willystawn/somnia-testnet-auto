// config.js

// This file contains all non-sensitive configuration for the bot.
// You can safely modify these values.

module.exports = {
    // 1. Blockchain Network Configuration
    rpcUrl: process.env.RPC_URL || "https://dream-rpc.somnia.network",
    
    // 2. Contract and Token Addresses
    routerAddress: "0x6AAC14f090A35EeA150705f72D90E4CDC4a49b2C",
    tokenPingAddress: "0x33E7fAB0a8a5da1A923180989bD617c9c2D1C493",
    tokenPongAddress: "0x9beaA0016c22B646Ac311Ab171270B0ECf23098F",
    
    // NEW: Wrapped Token (WSTT) Address
    wsttAddress: "0x4A3BC48C156384f9564Fd65A53a2f3D534D8f2b7",

    // 3. Swap & Wrap Parameters
    feeTier: 500,
    tokenDecimals: 18, // Assumed decimals for all tokens (PING, PONG, WSTT, Native)

    // 4. Randomization Settings
    // -- Swap amounts (PING <-> PONG)
    minAmountToSwap: 10,
    maxAmountToSwap: 15,

    // NEW: -- Wrap/Unwrap amounts (Native <-> WSTT)
    minAmountToWrap: 0.1,
    maxAmountToWrap: 0.5,

    // -- Delay between any two actions (in seconds)
    minDelaySeconds: 300, // 5 minutes
    maxDelaySeconds: 600, // 10 minutes

    // 5. Error Handling Settings
    // If an action fails due to insufficient funds (gas or tokens),
    // the bot will wait for this many hours before retrying for that account.
    longDelayHours: 4,
};