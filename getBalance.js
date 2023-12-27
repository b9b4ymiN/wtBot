const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const {
  sendData,
  lineSendMessage,
  sendDataNFT,
  lineSendMessageNFT,
} = require("./lineNoti");
const {
  metadata: { Metadata },
} = programs;
//@raydium-io/raydium-sdk
const {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
} = require("@raydium-io/raydium-sdk");
const { OpenOrders } = require("@project-serum/serum");
const { BN } = require("bn.js");

//const endpoint = "https://agace-p8zi4t-fast-mainnet.helius-rpc.com/";
const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";

const solanaConnection = new solanaWeb3.Connection(endpoint);

// raydium pool id can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
const OPENBOOK_PROGRAM_ID = new solanaWeb3.PublicKey(
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"
);

(async () => {
  const wallet = "JCapwSzWyHkjuVrT5ZTyKwBHzV9oYrTNhZguAMc9PiEc";
  const balance = await solanaConnection.getBalance(
    new solanaWeb3.PublicKey(wallet)
  );
  const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
  //Export sol banlance
  console.log("solBalance:", solBalance);

  // example to get pool info
  const info = await solanaConnection.getAccountInfo(
    new solanaWeb3.PublicKey(SOL_USDC_POOL_ID)
  );

  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  const openOrders = await OpenOrders.load(
    solanaConnection,
    poolState.openOrders,
    OPENBOOK_PROGRAM_ID // OPENBOOK_PROGRAM_ID(marketProgramId) of each pool can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
  );
  //console.info("openOrders:", openOrders);
  const baseDecimal = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const quoteDecimal = 10 ** poolState.quoteDecimal.toNumber();

  const baseTokenAmount = await solanaConnection.getTokenAccountBalance(
    poolState.baseVault
  );
  const quoteTokenAmount = await solanaConnection.getTokenAccountBalance(
    poolState.quoteVault
  );

  const basePnl = poolState.baseNeedTakePnl.toNumber() / baseDecimal;
  const quotePnl = poolState.quoteNeedTakePnl.toNumber() / quoteDecimal;

  const openOrdersBaseTokenTotal =
    openOrders.baseTokenTotal.toNumber() / baseDecimal;
  const openOrdersQuoteTokenTotal =
    openOrders.quoteTokenTotal.toNumber() / quoteDecimal;

  const base =
    (baseTokenAmount.value?.uiAmount || 0) + openOrdersBaseTokenTotal - basePnl;
  const quote =
    (quoteTokenAmount.value?.uiAmount || 0) +
    openOrdersQuoteTokenTotal -
    quotePnl;

  const denominator = new BN(10).pow(poolState.baseDecimal);

  console.log(
    "SOL_USDC pool info:",
    "\npool total base =" + base,
    "\npool total quote =" + quote,

    "\nbase vault balance =" + baseTokenAmount.value.uiAmount,
    "\nquote vault balance =" + quoteTokenAmount.value.uiAmount,

    "\nbase tokens in openorders =" + openOrdersBaseTokenTotal,
    "\nquote tokens in openorders  =" + openOrdersQuoteTokenTotal,

    "\nbase token decimals =" + poolState.baseDecimal.toNumber(),
    "\nquote token decimals =" + poolState.quoteDecimal.toNumber(),
    "\ntotal lp =" + poolState.lpReserve.div(denominator).toString()

    /*"addedLpAmount " +
      (addedLpAccount?.accountInfo.amount.toNumber() || 0) / baseDecimal*/
  );
})();
