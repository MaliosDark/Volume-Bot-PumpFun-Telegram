# Volume Bot for Pump Fun 🚀📈

Welcome to the Volume Bot for Pump Fun! This bot automates generating buy and sell volumes of tokens on the Solana blockchain, allowing you to capitalize on market movements. Below, you'll find a detailed guide on how to set up and use the bot.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Telegram Commands](#telegram-commands)
- [Functions Explanation](#functions-explanation)

## Prerequisites
- Node.js (v14 or later)
- NPM (Node Package Manager)
- A Telegram account
- Solana wallet with some SOL balance

## Installation
1. **Clone the repository**:
    ```sh
    git clone https://github.com/MaliosDark/Volume-Bot-PumpFun-Telegram.git
    cd volume-bot
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

## Configuration
1. **Set your private key**:
    Open the `index.js` file and replace the empty `PRIVKEY` array with your private key in `Uint8Array` format.

2. **Set the token address**:
    Replace the placeholder `ADD_TOKEN_ADDRESS_TO_BUY_SELL` with the actual token address you want to swap.

3. **Set the Telegram bot token**:
    Replace the placeholder `ADD_TELEGRAM_TOKEN_HERE` with your Telegram bot token.

4. **Adjust the settings** (optional):
    You can adjust the buy amount, fees, slippage, number of cycles, max simultaneous buys/sells, and intervals between actions directly in the `index.js` file.

## Usage
1. **Start the bot**:
    ```sh
    node index.js
    ```

2. **Interact with the bot via Telegram**:
    Use the provided commands to start/stop cycles, check status, configure settings, etc.

## Telegram Commands
- **/start**: Show the main menu.
- **Main Menu Options**:
  - **🔄 Start Buy/Sell Cycles**: Begin the buy/sell cycles.
  - **🛑 Stop Cycles**: Stop the current buy/sell cycles.
  - **📊 Status**: Show the current status of the bot.
  - **⚙️ Settings**: Access the settings menu to configure the bot.
  - **📜 Show Wallet**: Display the wallet address.
  - **❓ Help**: Display help information.

## Functions Explanation
### `swap`
Performs a token swap on the Solana blockchain.
```js
async function swap(tokenIn, tokenOut, solanaTracker, keypair, connection, amount, chatId)
```
- **tokenIn**: Address of the token to swap from.
- **tokenOut**: Address of the token to swap to.
- **solanaTracker**: Instance of the SolanaTracker.
- **keypair**: User's keypair for signing transactions.
- **connection**: Solana connection object.
- **amount**: Amount of tokenIn to swap.
- **chatId**: Telegram chat ID to send messages.

### `getTokenBalance`
Fetches the token balance of the user's wallet.
```js
async function getTokenBalance(connection, owner, tokenAddr)
```
- **connection**: Solana connection object.
- **owner**: Public key of the wallet owner.
- **tokenAddr**: Address of the token to check balance.

### `executeCycles`
Handles the buy and sell cycles.
```js
async function executeCycles(chatId)
```
- **chatId**: Telegram chat ID to send messages.

### `showMainMenu`
Displays the main menu in Telegram.
```js
function showMainMenu(chatId)
```
- **chatId**: Telegram chat ID to send messages.

### `showSettingsMenu`
Displays the settings menu in Telegram.
```js
function showSettingsMenu(chatId)
```
- **chatId**: Telegram chat ID to send messages.

### Telegram Callback Queries
Handles various actions based on user interaction with the bot.
```js
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;
    // Logic for handling different actions...
});
```

### Error Handling
Each function includes error handling to ensure smooth operation and proper messaging in case of issues.

## Conclusion
This bot automates the process of buying and selling tokens on the Solana blockchain using specified parameters and cycles. It integrates with Telegram to provide a user-friendly interface for monitoring and configuring the bot.

Enjoy your trading! 🚀📈

---

Feel free to customize and extend the bot according to your needs. If you have any questions or need further assistance, don't hesitate to contact @wherklow on Telegram.
