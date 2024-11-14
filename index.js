import { Telegraf } from "telegraf";
import { config } from "dotenv";
config();

let latestListingId;
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

async function getChatIds() {
  const updates = await bot.telegram.getUpdates();

  const chatIds = [];

  for (const update of updates) {
    if (update.message) chatIds.push(update.message.chat.id);
  }

  return chatIds;
}

function getMessage(listing) {
  return `${listing.title}\n\n[Link to Announcement](https://www.binance.com/en/support/announcement/${listing.code})`;
}

async function main() {
  try {
    const response = await fetch(
      "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageNo=1&pageSize=10"
    );
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();

    const listings = data.data.catalogs[0].articles;
    const currentLatestListingId = listings[0].id;

    if (!latestListingId) {
      latestListingId = currentLatestListingId;
      return;
    }
    if (latestListingId === currentLatestListingId) return;

    let latestListingIdIndex = listings.findIndex(
      (listing) => listing.id === latestListingId
    );
    if (latestListingIdIndex === -1) latestListingIdIndex = 10;

    const chatIds = await getChatIds();

    for (const chatId of chatIds) {
      for (let i = latestListingIdIndex - 1; i >= 0; --i) {
        const message = getMessage(listings[i]);
        await bot.telegram.sendMessage(chatId, message);
      }
    }

    latestListingId = currentLatestListingId;
  } catch (error) {
    console.log(error.message);
  }
}

setInterval(main, 1000 * 6);