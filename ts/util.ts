import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { OpenOrders } from "@project-serum/serum";
import {
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
  TokenAccount,
  LiquidityPoolKeys,
  Liquidity,
  TokenAmount,
  Token,
  Percent,
  Currency,
  LIQUIDITY_STATE_LAYOUT_V4,
} from "@raydium-io/raydium-sdk";

export async function getTokenAccountsByOwner(
  connection: Connection,
  owner: PublicKey
) {
  const tokenResp = await connection.getTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });

  const accounts: TokenAccount[] = [];

  for (const { pubkey, account } of tokenResp.value) {
    accounts.push({
      programId: TOKEN_PROGRAM_ID,
      pubkey,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}

export async function moniorPrice(
  connection: Connection,
  poolKeys: LiquidityPoolKeys
) {
  console.log("swap start");
  const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

  // real amount = 1000000 / 10**poolInfo.baseDecimals
  const amountIn = new TokenAmount(
    new Token(TOKEN_PROGRAM_ID, poolKeys.baseMint, poolInfo.baseDecimals),
    0.1,
    false
  );

  const currencyOut = new Token(
    TOKEN_PROGRAM_ID,
    poolKeys.quoteMint,
    poolInfo.quoteDecimals
  );

  // 5% slippage
  const slippage = new Percent(5, 100);

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

  console.log(
    `swap: ${poolKeys.id.toBase58()}, amountIn: ${amountIn.toFixed()}
    , amountOut: ${amountOut.toFixed()}, executionPrice: ${executionPrice?.toFixed()}`
  );
}
