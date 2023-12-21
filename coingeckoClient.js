const CoinGeckoClient = require('coingecko-api-v3')

const getPrice = async () => {
    const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true, });
    const solanaPrice = await cgc.simplePrice({
        vs_currencies: 'usd',
        ids: 'solana',
    })
    const priceUSD = solanaPrice.solana.usd
    console.log(priceUSD);

    //const accountKeys = txn.transaction.message.staticAccountKeys

    //console.log(accountKeys);
}

getPrice();
