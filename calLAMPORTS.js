const CoinGeckoClient = require("coingecko-api-v3");
const solanaWeb3 = require("@solana/web3.js");

const output = 25000279803;
const input = 5769339718683334;

const calTokenPrice = async (qtyIn, qtyOut) => {
  //input = any token
  //out = sol token
  const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true });
  const solanaPrice = await cgc.simplePrice({
    vs_currencies: "usd",
    ids: "solana",
  });
  const priceSol2USD = solanaPrice.solana.usd;
  const USDValue = qtyOut * priceSol2USD;
  return Number.parseFloat(USDValue / qtyIn).toFixed(7);
};

(async () => {
  const result_in = input / solanaWeb3.LAMPORTS_PER_SOL;
  console.log("result_in:", result_in);

  const result_out = output / solanaWeb3.LAMPORTS_PER_SOL;
  console.log("result_out:", result_out);

  const limit = await calTokenPrice(result_in, result_out);
  console.log("limit:", limit + " USD");
})();
