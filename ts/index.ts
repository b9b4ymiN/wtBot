import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
  Market,
  Liquidity,
  LiquidityPoolKeysV4,
  LiquidityPoolKeys,
} from "@raydium-io/raydium-sdk";
import { OpenOrders } from "@project-serum/serum";
import BN from "bn.js";
import { compute } from "./compute";
import { swapToken } from "./swap";
import base58 from "bs58";

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";

async function getTokenAccounts(connection: Connection, owner: PublicKey) {
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

// raydium pool id can get from api: https://api.raydium.io/v2/sdk/liquidity/mainnet.json
const SOL_USDC_POOL_ID = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
const OPENBOOK_PROGRAM_ID = new PublicKey(
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"
);

const programId = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

const connection = new Connection(endpoint, "confirmed");

//returns the pool keys (info and required params/program id's)
//neccessary to interact with the liquidity pool program and compute live prices and estimates.
export async function fetchPoolKeys(
  connection: Connection,
  poolId: PublicKey,
  version: 4 | 5 = 4
) {
  const serumVersion = 10;
  const marketVersion: 3 = 3;

  const programId = new PublicKey(
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
  );
  const serumProgramId = new PublicKey(
    "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX"
  );

  const account = await connection.getAccountInfo(poolId);
  const { state: LiquidityStateLayout } = Liquidity.getLayouts(version);

  //@ts-ignore
  const fields = LiquidityStateLayout.decode(account?.data);
  const {
    status,
    baseMint,
    quoteMint,
    lpMint,
    openOrders,
    targetOrders,
    baseVault,
    quoteVault,
    marketId,
    baseDecimal,
    quoteDecimal,
  } = fields;

  let withdrawQueue, lpVault;
  if (Liquidity.isV4(fields)) {
    withdrawQueue = fields.withdrawQueue;
    lpVault = fields.lpVault;
  } else {
    withdrawQueue = PublicKey.default;
    lpVault = PublicKey.default;
  }

  // uninitialized
  // if (status.isZero()) {
  //   return ;
  // }

  const associatedPoolKeys = Liquidity.getAssociatedPoolKeys({
    version: version,
    marketVersion,
    marketId,
    baseMint: baseMint,
    quoteMint: quoteMint,
    baseDecimals: baseDecimal.toNumber(),
    quoteDecimals: quoteDecimal.toNumber(),
    programId,
    marketProgramId: serumProgramId,
  });

  const poolKeys = {
    id: poolId,
    baseMint,
    quoteMint,
    lpMint,
    version,
    programId,

    authority: associatedPoolKeys.authority,
    openOrders,
    targetOrders,
    baseVault,
    quoteVault,
    withdrawQueue,
    lpVault,
    marketVersion: serumVersion,
    marketProgramId: serumProgramId,
    marketId,
    marketAuthority: associatedPoolKeys.marketAuthority,
  };

  const marketInfo = await connection.getAccountInfo(marketId);
  const { state: MARKET_STATE_LAYOUT } = Market.getLayouts(marketVersion);
  //@ts-ignore
  const market = MARKET_STATE_LAYOUT.decode(marketInfo.data);

  const {
    baseVault: marketBaseVault,
    quoteVault: marketQuoteVault,
    bids: marketBids,
    asks: marketAsks,
    eventQueue: marketEventQueue,
  } = market;

  // const poolKeys: LiquidityPoolKeys;
  return {
    ...poolKeys,
    ...{
      marketBaseVault,
      marketQuoteVault,
      marketBids,
      marketAsks,
      marketEventQueue,
    },
  };
}
export async function swap() {
  const poolKeys = await fetchPoolKeys(
    connection,
    new PublicKey(SOL_USDC_POOL_ID),
    4
  );
  //console.log(`fetched pool keys: ${poolKeys}`);
  //console.log(poolKeys);
  const computation: any = await compute(
    connection,
    poolKeys,
    poolKeys.baseMint,
    poolKeys.quoteMint,
    0.05, // qty_in
    2 // sil
  );

  const amountOut = computation[0];
  const minAmountOut = computation[1];
  const currentPrice = computation[2];
  const executionPrice = computation[3];
  const priceImpact = computation[4];
  const fee = computation[5];
  const amountIn = computation[6];

  console.log(
    `\n\tAmount out: ${amountOut.toFixed()},\n\tMin Amount out: ${minAmountOut.toFixed()}`,
    `\n\tcurrent Price: ${currentPrice.toFixed()},\n\texecution Price: ${executionPrice.toFixed()}`
  );
  if (priceImpact.toFixed() > 5) {
    console.log(`\tpriceImpact: ${priceImpact.toFixed()}`);
  } else if (priceImpact.toFixed() < 5 && priceImpact.toFixed() > 1) {
    console.log(`\tpriceImpact: ${priceImpact.toFixed()}`);
  } else {
    console.log(`\tpriceImpact: ${priceImpact.toFixed()}`);
  }

  //Uint8Array
  let secretKeyz = base58.decode("[base58 private key here]");
  console.log(`[${Keypair.fromSecretKey(secretKeyz).secretKey}]`);

  let KEYPAIRS: Keypair = Keypair.fromSecretKey(secretKeyz);
  //start swap
  const swap_result = await swapToken(
    connection,
    poolKeys,
    KEYPAIRS,
    amountIn,
    minAmountOut
  );

  console.log("swap_result:", swap_result);
}

swap();
//https://github.com/zeroday-xefi/solana-sniper-tools
