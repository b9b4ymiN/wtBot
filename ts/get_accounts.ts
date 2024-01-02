import {
  SPL_ACCOUNT_LAYOUT,
  TOKEN_PROGRAM_ID,
  TokenAccount,
} from "@raydium-io/raydium-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

//fetching token accounts
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
      pubkey,
      programId: TOKEN_PROGRAM_ID,
      accountInfo: SPL_ACCOUNT_LAYOUT.decode(account.data),
    });
  }

  return accounts;
}

const test = async () => {
  const endpoint =
    "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";
  const connection = new Connection(endpoint, "confirmed");
  const wallet = "8onY8aRreAbmR1hokTPkGJ11UDHSM3ReAEY1GS34E9Ev";
  const accountInfo = await getTokenAccountsByOwner(
    connection,
    new PublicKey(wallet)
  );
  console.log("accountInfo", accountInfo);
};

test();
