const TelegramBot = require('node-telegram-bot-api');
const token = '8484876413:AAE-r-Yl30GTMsooUJU-Z7bBcHdQiMXHUyA'; // Replace with your actual bot token
const allowedChatId = [-1002994900797]; // Add your group IDs here
const bot = new TelegramBot(token, { polling: true });
const fs = require('fs');
const path = require('path');

// --------- Load bot data file (scheduled messages + triggers) ---------
let botData = {
  scheduledMessages: [],
  triggers: []
};

try {
  const data = fs.readFileSync('./bot-data.json', 'utf8');
  botData = JSON.parse(data);
  console.log("✅ OffchatApp bot data file successfully loaded!");
} catch (err) {
  console.log("⚠️ Failed to load bot data file, using default configuration.");
}

// In-memory stores
let scheduledMessages = {};
let triggers = {};

// --------- Helper: choose media method + caption split (<=1024 chars) ---------
function sendMediaMessage(chatId, mediaPath, message, options = {}) {
  const MAX_CAPTION_LENGTH = 1024;

  // If media is missing OR file doesn't exist, just send text
  if (!mediaPath || !fs.existsSync(mediaPath)) {
    if (mediaPath && !fs.existsSync(mediaPath)) {
      console.log(`⚠️ Media not found at ${mediaPath}. Sending text only.`);
    }
    return bot.sendMessage(chatId, message, { parse_mode: "Markdown", ...options });
  }

  const extension = path.extname(mediaPath).toLowerCase();

  // Split long captions
  let caption = message;
  let extraMessage = null;

  if (message.length > MAX_CAPTION_LENGTH) {
    let breakPoint = MAX_CAPTION_LENGTH;
    for (let i = MAX_CAPTION_LENGTH - 100; i < MAX_CAPTION_LENGTH; i++) {
      if (message[i] === '\n' || message[i] === '.' || message[i] === '!') {
        breakPoint = i + 1;
        break;
      }
    }
    caption = message.substring(0, breakPoint).trim();
    extraMessage = message.substring(breakPoint).trim();
  }

  const messageOptions = {
    caption: caption,
    parse_mode: "Markdown",
    ...options
  };

  let sendPromise;
  switch (extension) {
    case '.gif':
      sendPromise = bot.sendDocument(chatId, mediaPath, messageOptions);
      break;
    case '.mp4':
    case '.mov':
    case '.avi':
      sendPromise = bot.sendVideo(chatId, mediaPath, messageOptions);
      break;
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.webp':
      sendPromise = bot.sendPhoto(chatId, mediaPath, messageOptions);
      break;
    default:
      console.log(`⚠️ Unsupported media format: ${extension}, sending as document`);
      sendPromise = bot.sendDocument(chatId, mediaPath, messageOptions);
      break;
  }

  if (extraMessage) {
    return sendPromise.then(() => {
      return bot.sendMessage(chatId, extraMessage, { parse_mode: "Markdown", ...options });
    });
  }

  return sendPromise;
}

// --------- Schedules & Triggers from bot-data.json ---------
botData.scheduledMessages.forEach(msg => {
  if (msg.active) {
    scheduledMessages[msg.id] = setInterval(() => {
      const randomChatId = Array.isArray(allowedChatId) ? 
        allowedChatId[Math.floor(Math.random() * allowedChatId.length)] : allowedChatId;

      sendMediaMessage(randomChatId, `./${msg.media}`, msg.message)
        .then(() => console.log(`✅ Scheduled OffchatApp message sent: ID ${msg.id}`))
        .catch(err => {
          console.error(`❌ Error sending scheduled message ${msg.id}: ${err.message}`);
          bot.sendMessage(randomChatId, msg.message, { parse_mode: "Markdown" })
            .catch(fallbackErr => console.error(`❌ Fallback message failed: ${fallbackErr.message}`));
        });
    }, msg.interval);

    const mediaInfo = msg.media ? `, Media: ${msg.media}` : '';
    console.log(`🕐 OffchatApp scheduled message started: ID ${msg.id}, every ${msg.interval}ms${mediaInfo}`);
  }
});

botData.triggers.forEach(trigger => {
  if (!trigger.word) return;
  triggers[trigger.word.toLowerCase()] = {
    response: trigger.response || '',
    media: trigger.media ? `./${trigger.media}` : null
  };
  console.log(`🔔 OffchatApp trigger configured: "${trigger.word}"${trigger.media ? ` with media: ${trigger.media}` : ''}`);
});

// --------- Static config ---------
const filteredWords = ['scam', 'fraud', 'fake', 'ponzi', 'rug', 'dump'];

// If welcome image isn't present, we'll still send text
const welcomeMediaPath = fs.existsSync('./welcome.png') ? './welcome.png' : null;

const welcomeKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [
        { text: '🌐 OffchatApp Website', url: 'https://offchatapp.com/' },
        { text: '💰 Staking Platform', url: 'https://offchatstake.com/' }
      ],
      [
        { text: '📊 CoinGecko Listing', url: 'https://coingecko.com/en/coins/offchat' },
        { text: '🔗 Supply API', url: 'https://offchat.online/' }
      ],
      [
        { text: '📱 Telegram Community', url: 'https://t.me/offchat_app' },
        { text: '📝 Medium Blog', url: 'https://medium.com/@OffchatApp' }
      ],
      [
        { text: '📖 Technical Whitepaper', url: 'https://offchatapp.com/whitepaper' },
        { text: '💻 GitHub Repository', url: 'https://github.com/offchatapp' }
      ]
    ]
  }
};

// --------- Define the missing welcomeMessage (fix) ---------
const shortWelcomeMessage = `
🌟 **Welcome to the OffchatApp Revolution!** 🌟

🚀 **The Future of Decentralized Communication is Here**

Welcome to the most advanced Web3 communication ecosystem! OffchatApp combines secure blockchain-based messaging with powerful staking and token utilities.

✨ **Highlights**
🔐 Zero‑Knowledge Privacy • ⛓️ Multi‑Chain • 📡 Mesh/Offline • 💎 $CRX • 🏆 Governance • ⚡ Sub‑50ms
`;

const extendedWelcomeMessage = `
💰 **Explore Our Ecosystem**
/website • /staking • /tokenomics • /security • /mobile • /community • /roadmap

*"We're not here to break chains — we're here to give you the tools to break free yourself."*
`;

// Provide a single exported constant used everywhere else
const welcomeMessage = shortWelcomeMessage.trim();

// --------- Logging ---------
console.log("🚀 OffchatApp Community Bot started...");
console.log("🔐 Advanced security protocols activated");
console.log("⚡ Multi-chain integration ready");
console.log("🌐 Decentralized communication enabled");

// --------- Utilities ---------
function isForwardedMessage(m) {
  return Boolean(
    m.forward_origin ||
    m.forward_from ||
    m.forward_from_chat ||
    m.forward_sender_name ||
    typeof m.forward_date !== 'undefined' ||
    m.is_automatic_forward === true
  );
}

function hasBlockedLinks(m) {
  const text = (m.text || m.caption || '');
  const entities = (m.entities || m.caption_entities || []);
  if (!text || entities.length === 0) return false;

  const blocked = /(?:^|[^a-z0-9])(t\.me\/|telegram\.me\/|telegram\.org\/|joinchat\/|invite\/|discord\.gg\/|discord\.com\/invite\/|bit\.ly\/|tinyurl\.com\/)/i;
  const hasUrlEntity = entities.some(e => e.type === 'url' || e.type === 'text_link');
  return hasUrlEntity && blocked.test(text) && !text.includes('offchatapp.com') && !text.includes('offchat');
}

function hasSpamKeywords(text) {
  const spamWords = [
    'airdrop', 'free tokens', 'guaranteed profit', 'double your money',
    'investment opportunity', 'get rich quick', 'limited time offer',
    'click here now', 'urgent', 'limited spots', 'exclusive deal'
  ];
  return spamWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
}

// --------- Commands / Handlers ---------

// Debug: /chatid
bot.onText(/\/chatid/, (msg) => {
  bot.sendMessage(msg.chat.id, `Chat ID: ${msg.chat.id}\nOffchatApp Bot Active ✅`);
  console.log(`OffchatApp - Requested Chat ID: ${msg.chat.id}`);
});

// Generic message handler (security + triggers + welcomes)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  console.log(`📨 OffchatApp - Message received, chat: ${chatId}`);

  const isAllowedChat = Array.isArray(allowedChatId) ? 
    allowedChatId.includes(chatId) : chatId === allowedChatId;
  
  if (!isAllowedChat && msg.chat.type !== 'private') {
    console.log(`⚠️ Skipping message - not from allowed chat (${chatId})`);
    return;
  }

  // SECURITY 1: Block forwarded
  if (isForwardedMessage(msg)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, "🛡️ *OffchatApp Security Alert*\n\nForwarded messages are not allowed in our community. Please share content directly.", { parse_mode: "Markdown" })
      .then(w => setTimeout(() => bot.deleteMessage(chatId, w.message_id).catch(() => {}), 10000));
    return;
  }

  // SECURITY 2: Block suspicious links
  if (hasBlockedLinks(msg)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    bot.sendMessage(chatId, "🚨 *OffchatApp Security Notice*\n\nSuspicious links detected. Please use official OffchatApp links only:\n• https://offchatapp.com\n• https://offchatstake.com\n• https://t.me/offchat_app", { parse_mode: "Markdown" })
      .then(w => setTimeout(() => bot.deleteMessage(chatId, w.message_id).catch(() => {}), 15000));
    return;
  }

  // Welcome new members
  if (msg.new_chat_members && msg.new_chat_members.length > 0) {
    msg.new_chat_members.forEach((member) => {
      if (member.is_bot) return;
      const userName = (member.first_name + ' ' + (member.last_name || '')).trim();
      const personalWelcome = `Hello ${userName}! ${welcomeMessage}`;
      sendMediaMessage(chatId, welcomeMediaPath, personalWelcome, welcomeKeyboard)
        .then(() => bot.sendMessage(chatId, extendedWelcomeMessage, { parse_mode: "Markdown", ...welcomeKeyboard }))
        .catch(err => console.error(`❌ Failed to send OffchatApp welcome: ${err.message}`));
    });
  }

  const text = (msg.text || msg.caption || '').toLowerCase();

  // Filter bad words
  filteredWords.forEach(word => {
    if (text.includes(word)) {
      bot.deleteMessage(chatId, msg.message_id).catch(() => {});
    }
  });

  // Spam detection
  if (hasSpamKeywords(text)) {
    bot.deleteMessage(chatId, msg.message_id).catch(() => {});
  }

  // Triggers
  for (const keyword in triggers) {
    if (text.includes(keyword)) {
      const triggerData = triggers[keyword];
      sendMediaMessage(chatId, triggerData.media, triggerData.response)
        .catch(err => {
          console.error(`❌ Trigger send error: ${err.message}`);
          bot.sendMessage(chatId, triggerData.response || '', { parse_mode: "Markdown" }).catch(() => {});
        });
      break;
    }
  }
});

// Dedicated new_chat_members event (redundant but OK)
bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  const isAllowedChat = Array.isArray(allowedChatId) ? 
    allowedChatId.includes(chatId) : chatId === allowedChatId;
  if (!isAllowedChat) return;

  msg.new_chat_members.forEach((member) => {
    if (member.is_bot) return;
    const userName = (member.first_name + ' ' + (member.last_name || '')).trim();
    const personalWelcome = `Hello ${userName}! ${welcomeMessage}`;
    sendMediaMessage(chatId, welcomeMediaPath, personalWelcome, welcomeKeyboard)
      .then(() => bot.sendMessage(chatId, extendedWelcomeMessage, { parse_mode: "Markdown", ...welcomeKeyboard }))
      .catch(err => console.error(`❌ Failed to send OffchatApp welcome in special handler: ${err.message}`));
  });
});

// /start
bot.onText(/\/start/, (msg) => {
  console.log("🚀 OffchatApp - Start command received");
  sendMediaMessage(msg.chat.id, welcomeMediaPath, welcomeMessage, welcomeKeyboard)
    .then(() => bot.sendMessage(msg.chat.id, extendedWelcomeMessage, { parse_mode: "Markdown", ...welcomeKeyboard }))
    .catch(err => {
      console.error(`❌ /start welcome send failed: ${err.message}`);
      bot.sendMessage(msg.chat.id, `${welcomeMessage}\n\n${extendedWelcomeMessage}`, { parse_mode: "Markdown", ...welcomeKeyboard }).catch(() => {});
    });
});

// Other info commands
function sendInfo(msg, text) {
  bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown", ...welcomeKeyboard }).catch(() => {});
}

bot.onText(/\/website/, (msg) => { console.log("🌐 OffchatApp - Website command received"); sendInfo(msg, `Visit: [OffchatApp.com](https://offchatapp.com) | Whitepaper: [Technical Documentation](https://offchatapp.com/whitepaper)`); });
bot.onText(/\/staking/, (msg) => { console.log("💰 OffchatApp - Staking command received"); sendInfo(msg, `Start earning today: [OffchatStake.com](https://offchatstake.com)`); });
bot.onText(/\/tokenomics/, (msg) => { console.log("📊 OffchatApp - Tokenomics command received"); sendInfo(msg, `Track live metrics: [Offchat.online](https://offchat.online) | Charts: [CoinGecko](https://coingecko.com/en/coins/offchat)`); });
bot.onText(/\/security/, (msg) => { console.log("🛡️ OffchatApp - Security command received"); sendInfo(msg, `*"Privacy is not about hiding something. It's about protecting everything."* - OffchatApp Security Team`); });
bot.onText(/\/mobile/, (msg) => { console.log("📱 OffchatApp - Mobile command received"); sendInfo(msg, `📱 iOS/Android apps: Q2 2025 • Web App: [app.offchatapp.com](https://app.offchatapp.com)`); });
bot.onText(/\/community/, (msg) => { console.log("🤝 OffchatApp - Community command received"); sendInfo(msg, `Join Telegram: [@OffchatApp](https://t.me/offchat_app) • GitHub: [github.com/offchatapp](https://github.com/offchatapp)`); });
bot.onText(/\/roadmap/, (msg) => { console.log("🛣️ OffchatApp - Roadmap command received"); sendInfo(msg, `2025 focus: Mobile, ZK, Mesh • 2026: Extensions, AI, Quantum readiness`); });

// Quick info
bot.onText(/\/price/, (msg) => {
  sendInfo(msg, "📈 **$CRX Price Information**\n\n• Live Price: CoinGecko\n• Market Cap: CoinGecko\n• Supply API: [Offchat.online](https://offchat.online)\n• Trading: Multiple DEX");
});

bot.onText(/\/ca|\/contract/, (msg) => {
  sendInfo(msg, "🔗 **OffchatApp Contract Addresses**\n\n• Ethereum / BSC / Polygon: Coming soon\n\n⚠️ Always verify on official channels!");
});

bot.onText(/\/help/, (msg) => {
  const helpMessage = `
🤖 **OffchatApp Bot Commands**
/start • /website • /staking • /tokenomics • /security • /mobile • /community • /roadmap
/price • /ca • /chatid • /help
`;
  sendInfo(msg, helpMessage);
});

// Errors
bot.on('polling_error', (error) => {
  console.error(`OffchatApp - Polling error: ${error.message}`);
});
bot.on('error', (error) => {
  console.error(`OffchatApp - Bot error: ${error.message}`);
});
process.on('uncaughtException', (err) => {
  console.error('OffchatApp - Uncaught exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('OffchatApp - Unhandled rejection at:', promise, 'reason:', reason);
});

console.log("✅ OffchatApp Community Bot fully initialized!");
console.log("🔐 Zero-knowledge privacy protocols active");
console.log("⛓️ Multi-chain integration ready");
console.log("🌍 Global P2P network connected");
console.log("💎 $CRX ecosystem monitoring active");
