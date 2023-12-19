const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const { sendData, lineSendMessage } = require('./lineNoti')
const {
  metadata: { Metadata },
} = programs;

const endpoint =
  "https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/";
const solanaConnection = new solanaWeb3.Connection(endpoint);
const searchAddress = "GSE6vfr6vws493G22jfwCU6Zawh3dfvSYXYQqKhFsBwe";

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
          if (tokenChange != 0) {
            return new Promise((resolve) => {
              resolve({ token: data_token, tokenChange, address: account.mint });
            });
          }
        })
      );
      return token_list;
    } else return null;
    // No wallet using token
  } catch {
    return null;
  }
};


const getTransaction = async (txn) => {
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
    searchAddress
  );
  //getting SPL balance change
  let { preTokenBalances, postTokenBalances } = transactionDetail.meta;
  let SPL_data = await getSPLInformation(
    preTokenBalances,
    postTokenBalances,
    searchAddress
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

      data_export.tokenOut = outToken.token.name;
      data_export.qtyOut = outToken.tokenChange;
      data_export.tokenOut_info = outToken.token;
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
      } else {
        //Input == token
        //Output == SOL
        data_export.tokenIn = SPL_data[0].token.name;
        data_export.qtyIn = SPL_data[0].tokenChange;
        data_export.tokenIn_info = SPL_data[0].token;

        data_export.tokenOut = "SOL";
        data_export.qtyOut = sol_data.solChange;
        data_export.tokenOut_info = null;
      }
    }
  }

  return data_export;
};



(async () => {
  const pubKey = new solanaWeb3.PublicKey(searchAddress);
  console.log('start wallet : ', searchAddress)
  solanaConnection.onAccountChange(
    new solanaWeb3.PublicKey(pubKey),
    async (updatedAccountInfo, context) => {
      const signatures = await solanaConnection.getSignaturesForAddress(
        pubKey,
        { limit: 1 }
      );
      signatures.forEach((x) => {
        console.log("signatures : ", x.signature);
      });
      let dataE = await getTransaction(signatures[0].signature);
      let dataSend = await sendData('pow', dataE);
      lineSendMessage(dataSend);
    },
    "finalized"
  );
})();
