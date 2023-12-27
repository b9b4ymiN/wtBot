const {
  Raydium,
  Token,
  Percent,
  TokenAmount,
} = require("@raydium-io/raydium-sdk");
const { BN } = require("bn.js");

//https://www.jsdelivr.com/package/npm/test-raydium-sdk-v2
const raydium = Raydium.load({
  connection,
  owner, // please provide key pair, if want to handle tx by yourself, just provide publicKey
  signAllTransactions, // optional - provide sign functions provided by @solana/wallet-adapter-react
});

const { transaction, signers, execute } = await raydium.trade.directSwap({});

const txId = execute();


//https://github.com/abbylow/raydium-swap.git
//https://abbylow.medium.com/learn-to-build-a-swap-application-with-solana-wallet-adapter-and-raydium-sdk-part-2-244705cb72a3