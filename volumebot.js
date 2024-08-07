import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SolanaTracker } from "solana-swap";
import { Buffer } from "buffer";
import TelegramBot from "node-telegram-bot-api";

// Solana RPC URL
const RPC_URL = "https://api.mainnet-beta.solana.com";

// User's private key (must be in Uint8Array format)
const PRIVKEY = [];

// SPL token address being swapped
let TOKEN_ADDR = "ADD_TOKEN_ADDRESS_TO_BUY_SELL";

// SOL token address (Solana's native token often used in swaps)
const SOL_ADDR = "So11111111111111111111111111111111111111112";

// Buy amount in SOL and fees
let SOL_BUY_AMOUNT = 0.0105;
let FEES = 0.0005;
let SLIPPAGE = 2;

// Telegram bot credentials
const TELEGRAM_TOKEN = "ADD_TELEGRAM_TOKEN_HERE";
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// Variables to store state
let numberOfCycles = 3;
let maxSimultaneousBuys = 1;
let maxSimultaneousSells = 1;
let intervalBetweenActions = 15000; // 15 seconds
let cycleInterval = 30000; // 30 seconds
let running = false;

// Function to perform the swap
async function swap(tokenIn, tokenOut, solanaTracker, keypair, connection, amount, chatId) {
    try {
        const swapResponse = await solanaTracker.getSwapInstructions(
            tokenIn,
            tokenOut,
            amount,
            SLIPPAGE,
            keypair.publicKey.toBase58(),
            FEES,
            false
        );

        console.log("Send swap transaction...");
        console.log("Full Swap Response:", swapResponse);

        if (!swapResponse || !swapResponse.txn) {
            throw new Error('Invalid swap response: transaction data is missing.');
        }

        const serializedTransactionBuffer = Buffer.from(swapResponse.txn, 'base64');
        const transaction = Transaction.from(serializedTransactionBuffer);
        transaction.sign(keypair);

        const txid = await connection.sendTransaction(transaction, [keypair], { skipPreflight: true });
        await connection.confirmTransaction(txid, 'confirmed');

        console.log("Swap sent: " + txid);
        if (chatId) {
            bot.sendMessage(chatId, `✅ Swap completed: ${txid}`);
        }
        return txid;

    } catch (e) {
        console.error("Error when trying to swap:", e.message);
        if (chatId) {
            bot.sendMessage(chatId, `⚠️ Error when trying to swap: ${e.message}`);
        }
    }
}

// Function to get the token balance
async function getTokenBalance(connection, owner, tokenAddr) {
    try {
        const result = await connection.getTokenAccountsByOwner(owner, { mint: new PublicKey(tokenAddr) });
        if (result.value.length === 0) {
            throw new Error('No token accounts found');
        }

        const info = await connection.getTokenAccountBalance(result.value[0].pubkey);
        if (info.value.uiAmount == null) throw new Error('No balance found');
        return info.value.uiAmount;
    } catch (e) {
        console.error("Error when trying to get token balance:", e.message);
        return 0;
    }
}

// Main function to handle buy and sell cycles
async function executeCycles(chatId) {
    try {
        const privKeyBuffer = Buffer.from(PRIVKEY);
        const keypair = Keypair.fromSecretKey(privKeyBuffer);
        const solanaTracker = new SolanaTracker(keypair, RPC_URL);
        const connection = new Connection(RPC_URL);

        running = true;

        for (let i = 0; i < numberOfCycles && running; i++) {
            bot.sendMessage(chatId, `🔄 Cycle ${i + 1}: Performing buy...`);
            for (let j = 0; j < maxSimultaneousBuys; j++) {
                await swap(SOL_ADDR, TOKEN_ADDR, solanaTracker, keypair, connection, SOL_BUY_AMOUNT, chatId);
                await new Promise(r => setTimeout(r, intervalBetweenActions));
            }

            const balance = Math.round(await getTokenBalance(connection, keypair.publicKey, TOKEN_ADDR));
            if (balance > 0) {
                bot.sendMessage(chatId, `🔄 Cycle ${i + 1}: Performing sell...`);
                for (let k = 0; k < maxSimultaneousSells; k++) {
                    await swap(TOKEN_ADDR, SOL_ADDR, solanaTracker, keypair, connection, balance / maxSimultaneousSells, chatId);
                    await new Promise(r => setTimeout(r, intervalBetweenActions));
                }
            } else {
                bot.sendMessage(chatId, `🔄 Cycle ${i + 1}: No balance available to sell.`);
            }

            const duration = (intervalBetweenActions * maxSimultaneousBuys + cycleInterval) / 1000;
            bot.sendMessage(chatId, `🕰️ Duration for cycle ${i + 1}: ${duration} seconds`);

            await new Promise(r => setTimeout(r, cycleInterval));
        }

        bot.sendMessage(chatId, `✅ All cycles completed.`);
        running = false;

    } catch (e) {
        console.error("Error in main execution:", e.message);
        bot.sendMessage(chatId, `⚠️ Error in main execution: ${e.message}`);
        running = false;
    }
}

// Function to show the main menu
function showMainMenu(chatId) {
    const mainMenu = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🔄 Start Buy/Sell Cycles', callback_data: 'start_cycles' }, { text: '🛑 Stop Cycles', callback_data: 'stop_cycles' }],
                [{ text: '📊 Status', callback_data: 'status' }, { text: '⚙️ Settings', callback_data: 'settings' }],
                [{ text: '📜 Show Wallet', callback_data: 'show_wallet' }, { text: '❓ Help', callback_data: 'help' }]
            ]
        }
    };
    bot.sendMessage(chatId, `Welcome! Please choose an option:`, mainMenu);
}

// Function to show the settings menu
function showSettingsMenu(chatId) {
    const settingsMenu = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '💰 Set Buy Amount', callback_data: 'set_buy_amount' }, { text: '💸 Set Fees', callback_data: 'set_fees' }],
                [{ text: '🔄 Set Number of Cycles', callback_data: 'set_number_of_cycles' }, { text: '🛒 Set Max Simultaneous Buys', callback_data: 'set_max_simultaneous_buys' }],
                [{ text: '📉 Set Max Simultaneous Sells', callback_data: 'set_max_simultaneous_sells' }, { text: '⏱ Set Interval Between Actions', callback_data: 'set_interval_between_actions' }],
                [{ text: '🖊️ Set Token Address', callback_data: 'set_token_address' }, { text: '🔙 Back to Main Menu', callback_data: 'back_to_main' }]
            ]
        }
    };
    bot.sendMessage(chatId, `Settings:`, settingsMenu);
}

// Telegram bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    showMainMenu(chatId);
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    if (action === 'start_cycles') {
        if (running) {
            bot.sendMessage(chatId, `🔄 Already running. Use "🛑 Stop Cycles" to stop the current process.`);
        } else {
            bot.sendMessage(chatId, `🔄 Starting the buy and sell cycles...`);
            executeCycles(chatId);
        }
    } else if (action === 'stop_cycles') {
        if (running) {
            running = false;
            bot.sendMessage(chatId, `🛑 Stopping the process...`);
        } else {
            bot.sendMessage(chatId, `🛑 No process is currently running.`);
        }
    } else if (action === 'status') {
        const privKeyBuffer = Buffer.from(PRIVKEY);
        const keypair = Keypair.fromSecretKey(privKeyBuffer);
        const connection = new Connection(RPC_URL);

        const solBalance = await connection.getBalance(keypair.publicKey) / 1e9;
        const tokenBalance = await getTokenBalance(connection, keypair.publicKey, TOKEN_ADDR);
        const estTransactions = Math.floor(solBalance / (SOL_BUY_AMOUNT + FEES));

        bot.sendMessage(chatId, `📊 Current status:\n💸 SOL Balance: ${solBalance}\n💸 Token Balance: ${tokenBalance}\n🔄 Estimated Transactions: ${estTransactions}\n⚙️ Current Settings\n  🏷️ CA: ${TOKEN_ADDR}\n  🛒 Buy Amount: ${SOL_BUY_AMOUNT} SOL\n  💰 Fees: ${FEES} SOL\n  🔁 Number of Cycles: ${numberOfCycles}\n  🔄 Max Simultaneous Buys: ${maxSimultaneousBuys}\n  📉 Max Simultaneous Sells: ${maxSimultaneousSells}\n  ⏱ Interval Between Actions: ${intervalBetweenActions / 1000} seconds\n  🚀 Running: ${running ? 'Yes' : 'No'}`);
    } else if (action === 'settings') {
        showSettingsMenu(chatId);
    } else if (action === 'set_buy_amount') {
        bot.sendMessage(chatId, `Please send the buy amount in SOL (e.g., 0.0105)`);
        bot.once('message', (msg) => {
            SOL_BUY_AMOUNT = parseFloat(msg.text);
            bot.sendMessage(chatId, `✅ Buy amount set to ${SOL_BUY_AMOUNT} SOL.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_fees') {
        bot.sendMessage(chatId, `Please send the fee amount in SOL (e.g., 0.0005)`);
        bot.once('message', (msg) => {
            FEES = parseFloat(msg.text);
            bot.sendMessage(chatId, `✅ Fees set to ${FEES} SOL.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_number_of_cycles') {
        bot.sendMessage(chatId, `Please send the number of cycles (e.g., 3)`);
        bot.once('message', (msg) => {
            numberOfCycles = parseInt(msg.text);
            bot.sendMessage(chatId, `✅ Number of cycles set to ${numberOfCycles}.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_max_simultaneous_buys') {
        bot.sendMessage(chatId, `Please send the maximum number of simultaneous buys (e.g., 1)`);
        bot.once('message', (msg) => {
            maxSimultaneousBuys = parseInt(msg.text);
            bot.sendMessage(chatId, `✅ Maximum simultaneous buys set to ${maxSimultaneousBuys}.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_max_simultaneous_sells') {
        bot.sendMessage(chatId, `Please send the maximum number of simultaneous sells (e.g., 1)`);
        bot.once('message', (msg) => {
            maxSimultaneousSells = parseInt(msg.text);
            bot.sendMessage(chatId, `✅ Maximum simultaneous sells set to ${maxSimultaneousSells}.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_interval_between_actions') {
        bot.sendMessage(chatId, `Please send the interval between actions in seconds (e.g., 15)`);
        bot.once('message', (msg) => {
            intervalBetweenActions = parseInt(msg.text) * 1000;
            bot.sendMessage(chatId, `✅ Interval between actions set to ${intervalBetweenActions / 1000} seconds.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'set_token_address') {
        bot.sendMessage(chatId, `Please send the new token address (e.g., 6TmL8DiBTvCgfwsfaR5WhSyEfaNV54qQKtpjgQS6pump)`);
        bot.once('message', (msg) => {
            TOKEN_ADDR = msg.text;
            bot.sendMessage(chatId, `✅ Token address set to ${TOKEN_ADDR}.`);
            showSettingsMenu(chatId);
        });
    } else if (action === 'show_wallet') {
        const privKeyBuffer = Buffer.from(PRIVKEY);
        const keypair = Keypair.fromSecretKey(privKeyBuffer);
        const walletAddress = keypair.publicKey.toBase58();

        bot.sendMessage(chatId, `📜 Wallet Address 👇👇👇👇👇`, {
            reply_markup: {
                inline_keyboard: [[{ text: walletAddress, callback_data: 'copy_wallet' }]]
            }
        });
    } else if (action === 'help') {
        bot.sendMessage(chatId, `ℹ️ For help, contact @wherklow directly.`);
    } else if (action === 'back_to_main') {
        showMainMenu(chatId);
    } else if (action === 'copy_wallet') {
        bot.sendMessage(chatId, `📝 Wallet address copied to clipboard.`);
    }
});
