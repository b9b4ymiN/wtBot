const solanaWeb3 = require("@solana/web3.js");
const {
  jsonInfo2PoolKeys,
  LiquidityPoolJsonInfo,
  LiquidityPoolKeys,
  Liquidity,
  TokenAmount,
  Token,
  Percent,
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
} = require("@raydium-io/raydium-sdk");
const axios = require("axios");

const swapInDirection = true;
const RAY_SOL_LP_V4_POOL_KEY = "89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip";
const RAYDIUM_LIQUIDITY_JSON =
  "https://api.raydium.io/v2/sdk/liquidity/mainnet.json";

const getPoolInfo = async () => {
  // fetch the liquidity pool list
  const liquidityJsonResp = await axios
    .get(RAYDIUM_LIQUIDITY_JSON)
    .then((res) => {
      //console.log("res:", res.data);
      return res.data;
    });

  const liquidityJson = liquidityJsonResp;
  //console.log("lp:", liquidityJson);
  const allPoolKeysJson = [
    ...(liquidityJson?.official ?? []),
    ...(liquidityJson?.unOfficial ?? []),
  ];
  // find the liquidity pair
  const poolKeysRaySolJson =
    allPoolKeysJson.filter(
      (item) => item.lpMint === RAY_SOL_LP_V4_POOL_KEY
    )?.[0] || null;
  // convert the json info to pool key using jsonInfo2PoolKeys
  const raySolPk = jsonInfo2PoolKeys(poolKeysRaySolJson);
  return raySolPk;
};
//https://github.com/abbylow/raydium-swap/blob/main/src/constant.ts
const calcAmountOut = async (
  connection,
  poolKeys,
  rawAmountIn,
  swapInDirection
) => {
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });
  console.log("poolInfo", poolInfo);
  let currencyInMint = poolKeys.baseMint;
  let currencyInDecimals = poolInfo.baseDecimals;
  let currencyOutMint = poolKeys.quoteMint;
  let currencyOutDecimals = poolInfo.quoteDecimals;

  if (!swapInDirection) {
    currencyInMint = poolKeys.quoteMint;
    currencyInDecimals = poolInfo.quoteDecimals;
    currencyOutMint = poolKeys.baseMint;
    currencyOutDecimals = poolInfo.baseDecimals;
  }

  const currencyIn = new Token(currencyInMint, currencyInDecimals);
  const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
  const currencyOut = new Token(currencyOutMint, currencyOutDecimals);
  const slippage = new Percent(5, 100); // 5% slippage

  const {
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  } = Liquidity.computeAmountOut({
    poolKeys,
    poolInfo,
    amountIn,
    currencyOut,
    slippage,
  });

  return {
    amountIn,
    amountOut,
    minAmountOut,
    currentPrice,
    executionPrice,
    priceImpact,
    fee,
  };
};

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

  let poolKey = await getPoolInfo();
  console.log("poolKey:", poolKey);

  const result = await calcAmountOut(
    solanaConnection,
    poolKey,
    solBalance,
    swapInDirection
  );
  console.log("result:", result);
})();
