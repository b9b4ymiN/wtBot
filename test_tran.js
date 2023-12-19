const solanaWeb3 = require("@solana/web3.js");
const { Connection, programs } = require("@metaplex/js");
const {
  metadata: { Metadata },
} = programs;
const searchAddress = "6RJTHCa7k1HTkRopp44JU1UjFftYpdAC2QZLVjvK5vWT"; //example 'pow'

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";
const solanaConnection = new solanaWeb3.Connection(endpoint);
const txn =
  "2obqNMh2jqA4MbhTCRGfsB1M54BSoGzTVANk8bb2Yv232SxFfZqwkT8qXdiR21UM9p34FrVRa2AnfiBogkxTGvzC"; // Sell token
const txn_buy =
  "4AQiCWZ3WpzFw2zDC6qJcrPQddbWJYWr97wh1vdtGULs7YH2wT1jZTb7jnjYUsZZJ9fMEjNeT6xoC66uCp2ky1D1";
const tx_buy_NFT =
  "Sx3qPyqpzoX95g7riVzmcPFrnW6pfpYwKGfR4pDHs1hCooSvYTSxBa2J3yHfESp89GL46A7NJBTtZigW9zm2RtF";

const txJup =
  "5dN6XidErTZ4kUS17WicXBDhKTkUMSCam31UPHRZEQob2qv9mFtxf2kqgZ3DsAat1Fvhnzki4gTb4vvq5rue76wH";
const tx_2way =
  "2witM53CsyubKBLrBhK4gAxPsuXY1n2KCcqo3WwgVkYjykaYG6ALBDH42V4XyBQEwVq9z4H5jLRCLAepYKu65m2o"; // Convert without SOL
//const searchAddress = 'xxxxxxqSkjrSvY1igNYjwcw5f9QskeLRKYEmJ1MezhB'; //example 'pow'

const way2token = "3GMdGH9YdfgMq6dqPp6tz3v5XtQqWEuh2r132w9v7R3c9sMUUftnQjy8eek9iKY2ERJgmiJ11ZHPUR1ajRt8ChQb"

const getMetadata = async (tokenPubKey) => {
  try {
    const addr = await Metadata.getPDA(tokenPubKey);
    const resp = await Metadata.load(solanaConnection, addr);
    return resp.data.data;
  } catch (error) {
    console.log("error fetching metadata: ", error);
  }
};

const getTransaction = async (txn) => {
  let transactionDetail = await solanaConnection.getParsedTransaction(txn, {
    maxSupportedTransactionVersion: 0,
  });

  const date = new Date(transactionDetail.blockTime * 1000);
  const transactionInstructions =
    transactionDetail.transaction.message.instructions;

  console.log(`Signature: ${txn}`);
  console.log(`Time: ${date}`);

  transactionDetail.meta.err
    ? console.log(`Status: Failed`)
    : console.log(`Status: Success`);

  let { preTokenBalances, postTokenBalances } = transactionDetail.meta;
  let { preBalances, postBalances } = transactionDetail.meta;
  console.log(
    `   ${"Item".padEnd(8)} ` +
    `${"owner".padEnd(45)} ` +
    `${"mint".padEnd(45)} ` +
    `${"tokenChange".padEnd(45)} ` +
    `${"post".padEnd(45)} `
  );

  let preToken_acc = preTokenBalances.filter(
    (x) => x.owner.toString() == searchAddress
  );
  let postToken_acc = postTokenBalances.filter(
    (x) => x.owner.toString() == searchAddress
  );

  if (preToken_acc.length != 0 && postToken_acc.length != 0) {
    preToken_acc.forEach(async (account, i) => {
      let tokenChange =
        postToken_acc[i].uiTokenAmount.uiAmount -
        account.uiTokenAmount.uiAmount;

      if (tokenChange != 0) {
        let data_token = null; // await getMetadata(account.mint);
        //console.log("account:", account);

        console.log(
          `   ${i.toString().padEnd(8)} ` +
          `${account.owner.padEnd(45)} ` +
          `${data_token != null
            ? data_token.name.padEnd(45)
            : account.mint.padEnd(45)
          }  ` +
          `${(tokenChange === 0 ? "-" : tokenChange.toFixed(2)).padEnd(45)} ` +
          `${(postToken_acc[i].uiTokenAmount.uiAmount
            ? postToken_acc[i].uiTokenAmount.uiAmount.toFixed(2)
            : "-"
          ).padEnd(45)} `
        );
      }
    });
  }

  console.log("");
  console.log(
    `   ${"Item".padEnd(8)} ` +
    `${"owner".padEnd(45)} ` +
    `${"tokenChange".padEnd(45)} ` +
    `${"post".padEnd(45)} `
  );

  console.log("postBalances : ", postBalances);
  transactionDetail.transaction.message.accountKeys
    .filter((x) => x.pubkey.toString() == searchAddress)
    .forEach((account, i) => {
      let solChange =
        (postBalances[i] - preBalances[i]) / solanaWeb3.LAMPORTS_PER_SOL;
      console.log(
        `   ${i.toString().padEnd(8)} ` +
        `${account.pubkey.toString()} ` +
        `${(solChange === 0 ? "-" : solChange.toFixed(2)).padEnd(45)} ` +
        `${"◎ " + (postBalances[i] / solanaWeb3.LAMPORTS_PER_SOL).toFixed(3)
        } `
      );
    });

  const dataExport = {
    solChange: 0,
  };

  console.log("-".repeat(100));
};

getTransaction('2m2vHPDHKsYu99Bo6j4KYQNPePGBJwVeVQMfUDdcA5nPhi9zY9N1MmvDDMzKiA1omy1wRPUoVaHhVkC6ZsKf9oAZ');
