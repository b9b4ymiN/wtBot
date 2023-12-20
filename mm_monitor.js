const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const {
  metadata: { Metadata },
} = programs;
const request = require("request");
const url_line_notification = "https://notify-api.line.me/api/notify";

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";
const solanaConnection = new solanaWeb3.Connection(endpoint);
const searchAddress = "588p6rkkdYrd7ktz4Pw85KifVdvercWQBjq541UcaGd1";

const getTokenMeta = async (tokenPubKey) => {
  try {
    const addr = await Metadata.getPDA(tokenPubKey);
    const resp = await Metadata.load(solanaConnection, addr);
    return new Promise((resolve) => {
      resolve(resp.data.data);
    });
  } catch (error) {
    console.log("error fetching metadata: ", error);
  }
};

const getSOLInformation = async (
  transactionDetail,
  preBalances,
  postBalances,
  wallet
) => {
  try {
    //Getting transaction change with wallet
    let kcKeys = transactionDetail.transaction.message.accountKeys.filter(
      (x) => x.pubkey.toString() == wallet
    );
    //Getting transaction check with wallet
    if (kcKeys != null && kcKeys.length != 0) {
      //Calculate sol change
      let sol_list = kcKeys.map((account, i) => {
        let solChange =
          (postBalances[i] - preBalances[i]) / solanaWeb3.LAMPORTS_PER_SOL;
        return solChange;
      });
      //Sum total sol change
      const sum = sol_list.reduce((accumulator, object) => {
        return accumulator + object;
      }, 0);
      //setting data sol for return
      return { solChange: sum, swap_type: sum == 0 ? 0 : 1 };
    } else return { solChange: 0, swap_type: 0 };
    // No wallet using sol
  } catch (err) {
    console.log("sol catch ", err);
    return null;
  }
};

const getSPLInformation = async (
  preTokenBalances,
  postTokenBalances,
  wallet
) => {
  try {
    //Getting transaction change with wallet
    let preToken_acc = preTokenBalances.filter(
      (x) => x.owner.toString() == wallet
    );
    let postToken_acc = postTokenBalances.filter(
      (x) => x.owner.toString() == wallet
    );
    //Getting transaction check with wallet
    if (preToken_acc != null && preToken_acc.length != 0) {
      //Calculate sol change
      let token_list = await Promise.all(
        preToken_acc.map(async (account, i) => {
          let data_token = await getTokenMeta(account.mint);
          let tokenChange =
            postToken_acc[i].uiTokenAmount.uiAmount -
            account.uiTokenAmount.uiAmount;
          return new Promise((resolve) => {
            resolve({ token: data_token, tokenChange, address: account.mint });
          });
        })
      );
      return token_list;
    } else return null;
    // No wallet using token
  } catch {
    return null;
  }
};

const getTransaction = async (txn, wallet) => {
  //setting data to export information
  let data_export = {};
  //setting txn link
  data_export.txn_link = "https://solscan.io/tx/" + txn;
  //getting information transaction
  let transactionDetail = await solanaConnection.getParsedTransaction(txn, {
    maxSupportedTransactionVersion: 0,
  });
  //getting and setting transaction time
  const date = new Date(transactionDetail.blockTime * 1000);
  data_export.time = date;
  //setting status
  transactionDetail.meta.err
    ? (data_export.status = "Failed")
    : (data_export.status = "Success");
  //getting sol balance information
  let { preBalances, postBalances } = transactionDetail.meta;
  let sol_data = await getSOLInformation(
    transactionDetail,
    preBalances,
    postBalances,
    wallet
  );
  //getting SPL balance change
  let { preTokenBalances, postTokenBalances } = transactionDetail.meta;
  let SPL_data = await getSPLInformation(
    preTokenBalances,
    postTokenBalances,
    wallet
  );
  if (sol_data != null && SPL_data != null) {
    data_export.model = "swapping";

    if (sol_data.swap_type == 0) {
      //swap with out SOL
      let inToken = SPL_data[0];
      let outToken = SPL_data[1];
      if (Math.sign(SPL_data[0].tokenChange) != -1) {
        inToken = SPL_data[1];
        outToken = SPL_data[0];
      }

      data_export.tokenIn = inToken.token.name;
      data_export.qtyIn = inToken.tokenChange;
      data_export.tokenIn_info = inToken.token;
      data_export.tokenIn_info.address = inToken.address;

      data_export.tokenOut = outToken.token.name;
      data_export.qtyOut = outToken.tokenChange;
      data_export.tokenOut_info = outToken.token;
      data_export.tokenOut_info.address = outToken.address;
    } else {
      //Swap with SOL
      if (Math.sign(sol_data.solChange) == -1) {
        //Input == SOL
        //Output == token
        data_export.tokenIn = "SOL";
        data_export.qtyIn = sol_data.solChange;
        data_export.tokenIn_info = null;

        data_export.tokenOut = SPL_data[0].token.name;
        data_export.qtyOut = SPL_data[0].tokenChange;
        data_export.tokenOut_info = SPL_data[0].token;
        data_export.tokenOut_info.address = SPL_data[0].address;
      } else {
        //Input == token
        //Output == SOL
        data_export.tokenIn = SPL_data[0].token.name;
        data_export.qtyIn = SPL_data[0].tokenChange;
        data_export.tokenIn_info = SPL_data[0].token;
        data_export.tokenIn_info.address = SPL_data[0].address;

        data_export.tokenOut = "SOL";
        data_export.qtyOut = sol_data.solChange;
        data_export.tokenOut_info = null;
      }
    }
  }

  return data_export;
};

const sendLineMsg = async function (msg) {
  request(
    {
      method: "POST",
      uri: url_line_notification,
      header: {
        "Content-Type": "multipart/form-data",
      },
      auth: {
        bearer: "Tx58J4iZdbCXwFSXyYyzVzTu76rN6Fjr3ie3PilxIvx",
      },
      form: {
        message: msg,
      },
    },
    (err, httpResponse, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log(body);
      }
    }
  );
};

const send2Client = async function (wallet, data_export) {
  try {
    if (detail != null) {
      let mode = "Swapping 💵";
      let symIn =
        data_export.tokenIn == "SOL" ? "◎" : data_export.tokenIn_info.symbol;
      let symOut =
        data_export.tokenOut == "SOL" ? "◎" : data_export.tokenOut_info.symbol;

      let message =
        `Name: ${wallet.name} \n Mode: ${mode} \n` +
        `Token_In: ${data_export.tokenIn} \n Amount: ${data_export.qtyIn} ${symIn} \n` +
        `======================== \n` +
        `Token_Out: ${data_export.tokenOut} \n Amount: ${data_export.qtyOut} \n` +
        ` \n` +
        `External Link: \n` +
        `======================== \n` +
        `txn:${data_export.txn_link} \n` +
        `chart: ${
          data_export.tokenIn == "SOL" || data_export.tokenIn == "USD Coin"
            ? ""
            : "https://birdeye.so/token/" + data_export.tokenIn_info.address
        }\n` +
        `chart: ${
          data_export.tokenOut == "SOL" || data_export.tokenOut == "USD Coin"
            ? ""
            : "https://birdeye.so/token/" + data_export.tokenOut_info.address
        }\n` +
        `check: ${
          data_export.tokenOut == "SOL" || data_export.tokenOut == "USD Coin"
            ? ""
            : "https://rugcheck.xyz/tokens/" + data_export.tokenOut_info.address
        }\n` +
        `check: ${
          data_export.tokenIn == "SOL" || data_export.tokenIn == "USD Coin"
            ? ""
            : "https://rugcheck.xyz/tokens/" + data_export.tokenIn_info.address
        }\n` +
        `External Link: \n`;

      let result = await sendLineMsg(message);
      //let result_Discord = await sendDiscordMsg(str4Send, detail.image);
      //console.log("result send : " + result);
    }
  } catch {
    console.log("Catch [send2Client]");
  }
};

const wallet_list = [
  { name: "wallet 1", address: "6NKxPzbopRP89jSvTgmxnguJCLwa9dr2HqHWJiBukoVu" },
  { name: "wallet 2", address: "FpkYUxd6j29LviaNJoP2MyXtwzyJWB6UbYL1Hx342aKu" },
  { name: "wallet 3", address: "2LCVy1NyLhGqqqExGZacPMQ9mxXAza3KXHGVZgrvPaoh" },
  { name: "wallet 4", address: "27LKVfLv8kFe4dq5BqxJoHiKLBsXAxLzpRdytYXd9iJJ" },
  { name: "wallet 5", address: "BMWKjXqkFY2ne7T1D5KT5bfCavxbCb5P97waA8eZvX9E" },
  { name: "wallet 6", address: "5Rk8kuizVXJU7GEWijtBtPPhceTXETw9ybocBSWpXK8" },
  { name: "wallet 7", address: "HenkBtb3i6qFxxrsKoeY7ge6fY96ofhsK84gxkBUKaNo" },
  { name: "wallet 8", address: "8oSadmLQ6zRu22uZ9wQuByVFNkU4b7qcrWTbfSjgjdpb" },
];

const monitor = () => {
  wallet_list.forEach((prop) => {
    console.log("start wallet [" + prop.name + "] = ", prop.address);
    const pubKey = new solanaWeb3.PublicKey(prop.address);
    let monitor = solanaConnection.onAccountChange(
      pubKey,
      async (updatedAccountInfo, context) => {
        const signatures = await solanaConnection.getSignaturesForAddress(
          pubKey,
          { limit: 1 }
        );
        signatures.forEach((x) => {
          console.log("signatures : ", x.signature);
        });
        let dataE = await getTransaction(signatures[0].signature, prop.address);
        console.log("data : ", dataE);
        send2Client(prop, dataE);
      },
      "finalized"
    );
  });
};

monitor();
