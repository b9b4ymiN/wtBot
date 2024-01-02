import {
  Liquidity,
  Percent,
  Token,
  TokenAccount,
  TokenAmount,
} from "@raydium-io/raydium-sdk";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { sendTx } from "./send_transaction";

export async function swapToken(
  connection: Connection,
  poolKeys: any,
  ownerKeypair: Keypair,
  amountIn: any,
  minAmountOut: any
) {
  const owner = ownerKeypair.publicKey;

  const inst = await Liquidity.makeSwapInstruction({
    poolKeys: poolKeys,
    userKeys: {
      tokenAccountIn: poolKeys.baseMint,
      tokenAccountOut: poolKeys.quoteMint,
      owner: owner,
    },
    amountIn: amountIn,
    amountOut: minAmountOut,
    fixedSide: "in",
  });

  //@ts-ignore
  //const instructions = inst.innerTransactions[0].instructions[0];
  //console.log(inst.innerTransactions);
  //console.log(inst.innerTransactions[0]);
  //console.log(inst.innerTransactions[0].signers)

  const tx = new Transaction();
  const signers: Keypair[] = [ownerKeypair];

  inst.innerTransaction.instructions.forEach((e) => {
    tx.add(e);
  });

  inst.innerTransaction.signers.forEach((e) => {
    signers.push(e);
  });

  const res: number = await sendTx(connection, tx, signers);
  return res;
}
