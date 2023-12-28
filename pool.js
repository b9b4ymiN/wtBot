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
const {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
  TokenAmount,
  Token,
} = require("@raydium-io/raydium-sdk");
const { clearScreenDown } = require("readline");

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";
const solanaConnection = new solanaWeb3.Connection(endpoint);

const getTokenMeta = async (tokenPubKey) => {
  try {
    const addr = await Metadata.getPDA(tokenPubKey);
    const resp = await Metadata.load(solanaConnection, addr);
    return new Promise((resolve) => {
      resolve(resp.data.data);
    });
  } catch (error) {
    console.log("error fetching metadata: ", error);
    return new Promise((resolve) => {
      resolve(null);
    });
  }
};

(async () => {
  const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
  //get pool info
  const info = await solanaConnection.getAccountInfo(
    new solanaWeb3.PublicKey(SOL_USDC_POOL_ID)
  );
  const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info.data);
  //console.log("poolState:", poolState);
  let currencyInMint = poolState.baseMint;
  let currencyOutMint = poolState.quoteMint;
  const currencyInDecimals = 10 ** poolState.baseDecimal.toNumber(); // e.g. 10 ^ 6
  const currencyOutDecimals = 10 ** poolState.quoteDecimal.toNumber();
  //console.log("currencyInMint:", currencyInMint, currencyInDecimals);
  //console.log("currencyOutMint:", currencyOutMint, currencyOutDecimals);

  const tokenIN_meta = await getTokenMeta(currencyInMint);
  const tokenIN_Info = await solanaConnection.getAccountInfo(currencyInMint);
  //console.log("token:", token);
  const tokenOut_meta = await getTokenMeta(currencyOutMint);
  const tokenOut_Info = await solanaConnection.getAccountInfo(currencyOutMint);

  const currencyIn = new Token(
    tokenIN_Info.owner,
    currencyInMint,
    currencyInDecimals,
    tokenIN_meta.symbol,
    tokenIN_meta.name
  );
  console.log("currencyIn:", currencyIn);
  const amountIn = new TokenAmount(currencyIn, 20, false);
  console.log("amountIn:", amountIn);

  const currencyOut = new Token(
    tokenOut_Info.owner,
    currencyOutMint,
    currencyOutDecimals,
    tokenOut_meta.symbol,
    tokenOut_meta.name
  );
  console.log("currencyOut:", currencyIn);
  const amountOut = new TokenAmount(currencyOut, 20, false);
  console.log("amountOut:", amountOut);
  //console.log("currencyIn:", currencyIn, amountIn);
  /*solanaConnection.onAccountChange(
    new solanaWeb3.PublicKey(pubKey),
    async (updatedAccountInfo, context) => {
      await delay(3000);
    },
    "finalized"
  );*/
})();
