import { Connection, ParsedAccountData, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  AccountLayout,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  LIQUIDITY_STATE_LAYOUT_V4,
  Market,
  Liquidity,
  LiquidityPoolKeysV4,
  LiquidityPoolKeys,
  publicKey,
  SERUM_PROGRAM_ID_V3,
  LiquidityPoolJsonInfo,
  jsonInfo2PoolKeys,
} from "@raydium-io/raydium-sdk";
import { OpenOrders } from "@project-serum/serum";
import BN from "bn.js";
import { compute } from "./compute";
import axios from "axios";

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";

const token_address = "DvEeyYPUPqmdSFHsAxPsuoneGZqyAZ2FRpsAGtGqYVJm";
const raydium_programId = new PublicKey(
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
);

const ex_pool_address = new PublicKey(
  "AZqjt9vYMGZMuNfzSmFjMFgcMHnkBPndpTn1uprKLrq2"
);

const test = async () => {
  const version: 4 | 5 = 4;
  const connection = new Connection(endpoint, "confirmed");
  const account = await connection.getAccountInfo(ex_pool_address);
  console.log(account);

  const pool = await Liquidity.fetchAllPoolKeys(connection, {
    4: new PublicKey("DvEeyYPUPqmdSFHsAxPsuoneGZqyAZ2FRpsAGtGqYVJm"),
    5: new PublicKey("DvEeyYPUPqmdSFHsAxPsuoneGZqyAZ2FRpsAGtGqYVJm"),
  });

  //const pool_address = await Liquidity.fetchAllPoolKeys(connection, account

  console.log(pool);

  /*
  const tokenAccount = await connection.getParsedAccountInfo(
    new PublicKey(token_address)
  );

  console.log((tokenAccount.value?.data as ParsedAccountData).parsed);
  const { info } = (tokenAccount.value?.data as ParsedAccountData).parsed;
  const { mintAuthority } = info;
  console.log("mintAuthority:", mintAuthority);
  const address2 = await getAssociatedTokenAddress(
    new PublicKey(token_address),
    raydium_programId
  );

  console.log("Using SPL-Token: ", address2);*/
};

const getPoolInfo = async () => {
  // fetch the liquidity pool list
  const RAYDIUM_LIQUIDITY_JSON =
    "https://api.raydium.io/v2/sdk/liquidity/mainnet.json";
  const baseMintAddress = "";
  const liquidityJsonResp = await axios.get(RAYDIUM_LIQUIDITY_JSON);
  if (!(await liquidityJsonResp)) return [];
  const liquidityJson = await liquidityJsonResp.data;
  const allPoolKeysJson = [
    ...(liquidityJson?.official ?? []),
    ...(liquidityJson?.unOfficial ?? []),
  ];
  // find the liquidity pair
  const poolKeysRaySolJson: LiquidityPoolJsonInfo =
    allPoolKeysJson.filter(
      (item) => item.baseMint === "DvEeyYPUPqmdSFHsAxPsuoneGZqyAZ2FRpsAGtGqYVJm"
    )?.[0] || null;
  // convert the json info to pool key using jsonInfo2PoolKeys
  const raySolPk = jsonInfo2PoolKeys(poolKeysRaySolJson);
  console.log(raySolPk);
};

getPoolInfo();
