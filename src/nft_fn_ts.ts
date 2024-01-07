export async function InferTradeDirection(
    wallet: string,
    logMessages: any,
    preTokenBalances: any,
    postTokenBalances: any) {
    const isListingInstruction = Boolean(
        logMessages.find(
            (message) =>
                message.includes("Instruction: List item") ||
                message.includes("Instruction: Sell") ||
                message.includes("Instruction: SellNftToTokenToNftPair") ||
                message.includes("Instruction: List")
        )
    );
    const isDelistingInstruction = Boolean(
        logMessages.find(
            (message) =>
                message.includes("Instruction: CancelSell") ||
                message.includes("Instruction: Cancel listing") ||
                message.includes("Instruction: Cancel") ||
                message.includes("Instruction: Delist")
        )
    );
    const isBuyInstruction = Boolean(
        logMessages.find(
            (message) =>
                message.includes("Instruction: Deposit") ||
                message.includes("Instruction: BuyNft") ||
                message.includes("Instruction: BuySingleListing")
        )
    );

    //Instant 
    const isSellInstantInstruction = Boolean(
        logMessages.find(
            (message) =>
                message.includes("Instruction: SellNftTokenPool") ||
                message.includes("Instruction: TakeBidFullMeta")
        )
    );

    //UPDATE_Price 
    const isUpdatePriceInstruction = Boolean(
        logMessages.find(
            (message) =>
                message.includes("Instruction: EditSingleListing")
        )
    );

    if (isUpdatePriceInstruction) {
        return "UPDATE PRICE 🆙";
    }

    if (isListingInstruction) {
        return "LISTING 📋";
    }

    if (isDelistingInstruction) {
        return "DE_LISTING ❌";
    }

    if (isSellInstantInstruction) {
        return "SELL INSTANT ⤵️";
    }

    if (isBuyInstruction) {
        return postTokenBalances[0].owner === wallet ? "BUY 💸" : "SELL 💰";
    }
}

export async function InferMarketPlace(accountKeys: any) {
    //console.info('Inferring solana marketplace')
    for (const [key, value] of Object.entries(PROGRAM_ACCOUNTS)) {
        let account = accountKeys.find((publicKey) =>
            value.includes(publicKey.toString())
        );
        // console.log('value : ' + value, ' pubKey : ' + account)
        if (account) {
            return { name: key, url: PROGRAM_ACCOUNT_URLS[key] };
        }
    }
    return null;
}


export const PROGRAM_ACCOUNTS = {
    MagicEden: [
        "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8",
        "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
    ],
    Solanart: [
        "CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz",
        "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk",
    ],
    MortuaryInc: ["minc9MLymfBSEs9ho1pUaXbQQPdfnTnxUvJa8TWx85E"],
    Yawww: ["5SKmrbAxnHV2sgqyDXkGrLrokZYtWWVEEk5Soed7VLVN"],
    Hyperspace: ["HYPERfwdTjyJ2SCaKHmpF2MtrXqWxrsotYDsTrshHWq8"],
    CoralCube: ["6U2LkBQ6Bqd1VFt7H76343vpSwS5Tb1rNyXSNnjkf9VL"],
    SpinerMarket: ["SNPRohhBurQwrpwAptw1QYtpFdfEKitr4WSJ125cN1g"],
    Tensor: ["TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN"],
    Hadeswap: ["hadeK9DLv9eA7ya5KCTqSvSvRZeJC3JgD5a9Y3CNbvu"],
    Tensor_cNFT: ["TCMPhJdwDryooaGtiocG1u3xcYbRpiJzb283XfCZsDp"]
}

export const PROGRAM_ACCOUNT_URLS = {
    MagicEden: "https://www.magiceden.io/item-details",
    Solanart: "https://solanart.io/search",
    MortuaryInc: "https://mortuary-inc.io",
    Yawww: "https://www.yawww.io/marketplace/listing",
    Hyperspace: "https://hyperspace.xyz/token",
    CoralCube: "https://coralcube.io/detail",
    SpinerMarket: "https://www.sniper.xyz/asset",
    Tensor: "https://www.tensor.trade/item",
    Hadeswap: "https://app.hadeswap.com/item/",
    Tensor_cNFT: "https://www.tensor.trade/item",
}