# Somnia Multi-Account Swap Bot

This is an automated, multi-account cryptocurrency swapping bot designed to run on the Somnia network. It periodically swaps between two specified tokens (e.g., PING and PONG) for multiple wallets simultaneously.

The bot is designed to mimic human behavior by using randomized swap amounts and delays between transactions.

## ⚠️ Important Warnings

*   **HIGH RISK**: This bot interacts with real cryptocurrencies on a live blockchain. Bugs, configuration errors, or market volatility can lead to a **complete loss of funds**. Use it at your own risk.
*   **SECURITY**: Your wallet private keys are stored in the `.env` file. **NEVER** share this file or commit it to a public repository (like GitHub). The provided `.gitignore` file is configured to prevent this, but you must still be cautious.
*   **GAS FEES**: Every transaction (both `approve` and `swap`) requires a gas fee paid in the Somnia network's native token. Running this bot 24/7 across multiple accounts will consume a significant amount of gas fees. Ensure all wallets are adequately funded.

## Features

*   **Multi-Account Support**: Runs swapping logic independently for multiple private keys.
*   **Bidirectional Swapping**: Automatically alternates between swapping Token A -> Token B and Token B -> Token A.
*   **Human-like Behavior**: Uses randomized swap amounts and delays to avoid typical bot patterns.
*   **Robust Error Handling**: Handles common errors like "insufficient funds" by pausing the specific account for a configurable duration.
*   **Configurable**: Easily manage all settings through `config.js` and `.env` files.
*   **24/7 Operation**: Designed to be run continuously using a process manager like `pm2`.
*   **Wrap/Unwrap Functionality**: Can wrap the native network token (e.g., STT) into its wrapped version (WSTT) and unwrap it back.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or newer)
*   [npm](https://www.npmjs.com/get-npm) (usually comes with Node.js)
*   A process manager like [pm2](https://pm2.keymetrics.io/) is recommended for continuous operation.

## Setup Instructions

1.  **Clone the Repository (or download the files):**
    ```bash
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Create and Configure the `.env` File:**
    This file stores your sensitive private keys. Create a file named `.env` in the root directory and add your private keys.
    ```ini
    # .env
    # Enter all your private keys here, separated by a comma, with NO spaces.
    PRIVATE_KEYS=0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    ```

4.  **Configure the `config.js` File:**
    Open `config.js` and adjust the settings to your needs. This includes:
    *   Token and router addresses.
    *   **NEW:** The wrapped token (WSTT) address.
    *   Swap amount ranges.
    *   **NEW:** Wrap/Unwrap amount ranges.
    *   Delay times between actions.
    *   The long delay for accounts that run out of funds.

## How to Run the Bot

### For Development / Testing

You can run the bot directly from your terminal. The process will stop when you close the terminal.

```bash
node index.js
```

### For Production (24/7 Operation)

Using `pm2` is the recommended way to keep the bot running in the background permanently.

1.  **Install PM2 Globally:**
    ```bash
    npm install pm2 -g
    ```

2.  **Start the Bot:**
    ```bash
    pm2 start index.js --name "somnia-swap-bot"
    ```

3.  **Manage the Bot with PM2:**
    *   **Monitor logs:** `pm2 logs somnia-swap-bot`
    *   **List all running processes:** `pm2 list`
    *   **Restart the bot:** `pm2 restart somnia-swap-bot`
    *   **Stop the bot:** `pm2 stop somnia-swap-bot`
    *   **Delete the bot from PM2:** `pm2 delete somnia-swap-bot`

## Disclaimer

This software is provided "as is", without warranty of any kind. The authors or copyright holders are not liable for any claim, damages, or other liability, including any financial losses, arising from the use of this software.