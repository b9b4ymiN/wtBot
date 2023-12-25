const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const { sendData, lineSendMessage, sendDataNFT, lineSendMessageNFT } = require("./lineNoti");
const {
  metadata: { Metadata },
} = programs;

const endpoint = "https://agace-p8zi4t-fast-mainnet.helius-rpc.com/";
const solanaConnection = new solanaWeb3.Connection(endpoint);
const lstWallet = require("./wallet.json");

const wallet_Fip = "FLiPggWYQyKVTULFWMQjAk26JfK5XRCajfyTmD5weaZ7";

const PROGRAM_ACCOUNTS = {
  MagicEden: [
    "MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8",
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",
  ],
  Solanart: [
    "CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz",
    "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk",
  ],
  MortuaryInc: ["minc9MLymfBSEs9ho1pUaXbQQPdfnTnxUvJa8TWx85E"],
  Yawww: ["5SKmrbAxnHV2sgqyDXkGrLrokZYtWWVEEk5Soed7VLVN"],
  Hyperspace: ["HYPERfwdTjyJ2SCaKHmpF2MtrXqWxrsotYDsTrshHWq8"],
  CoralCube: ["6U2LkBQ6Bqd1VFt7H76343vpSwS5Tb1rNyXSNnjkf9VL"],
  SpinerMarket: ["SNPRohhBurQwrpwAptw1QYtpFdfEKitr4WSJ125cN1g"],
  Tensor: ["TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN"],
};

const PROGRAM_ACCOUNT_URLS = {
  MagicEden: "https://www.magiceden.io/item-details",
  Solanart: "https://solanart.io/search",
  MortuaryInc: "https://mortuary-inc.io",
  Yawww: "https://www.yawww.io/marketplace/listing",
  Hyperspace: "https://hyperspace.xyz/token",
  CoralCube: "https://coralcube.io/detail",
  SpinerMarket: "https://www.sniper.xyz/asset",
  Tensor: "https://www.tensor.trade/item",
};

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
          if (data_token != null) {
            let tokenChange =
              postToken_acc[i].uiTokenAmount.uiAmount -
              account.uiTokenAmount.uiAmount;
            if (tokenChange != 0) {
              return new Promise((resolve) => {
                resolve({
                  token: data_token,
                  tokenChange,
                  address: account.mint,
                });
              });
            } else {
              return new Promise((resolve) => {
                resolve(null);
              });
            }
          }
        })
      );
      return token_list;
    } else if (postToken_acc != null && postToken_acc.length != 0) {
      let data_token = await getTokenMeta(postToken_acc[0].mint);
      if (data_token != null) {
        return new Promise((resolve) => {
          resolve([
            {
              token: data_token,
              tokenChange: postToken_acc[0].uiTokenAmount.uiAmount,
              address: postToken_acc[0].mint,
            },
          ]);
        });
      } else {
        return new Promise((resolve) => {
          resolve(null);
        });
      }
    } else return null;
    // No wallet using token
  } catch {
    return null;
  }
};

function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
}

const inferMarketPlace = async (accountKeys) => {
  //console.info('Inferring solana marketplace')
  for (const [key, value] of Object.entries(PROGRAM_ACCOUNTS)) {
    let account = accountKeys.find((publicKey) =>
      value.includes(publicKey.toString())
    );
    // console.log('value : ' + value, ' pubKey : ' + account)
    if (account) {
      return { name: key, url: PROGRAM_ACCOUNT_URLS[key] };
    }
  }
  return null;
};

const inferTradeDirection = (
  wallet,
  logMessages,
  preTokenBalances,
  postTokenBalances
) => {
  //console.log('log ', logMessages)
  const isListingInstruction = Boolean(
    logMessages.find(
      (message) =>
        message.includes("Instruction: List item") ||
        message.includes("Instruction: Sell") ||
        message.includes("Instruction: EditSingleListing")
    )
  );
  const isDelistingInstruction = Boolean(
    logMessages.find(
      (message) =>
        message.includes("Instruction: CancelSell") ||
        message.includes("Instruction: Cancel listing") ||
        message.includes("Instruction: Cancel")
    )
  );
  const isBuyInstruction = Boolean(
    logMessages.find(
      (message) =>
        message.includes("Instruction: Deposit") ||
        message.includes("Instruction: BuyNft") ||
        message.includes("Instruction: BuySingleListing")
    )
  );

  if (isListingInstruction) {

    return 'LISTING 📋'
  }

  if (isDelistingInstruction) {
    return 'DE_LISTING ❌'
  }

  if (isBuyInstruction) {
    return postTokenBalances[0].owner === wallet ? 'BUY 💸' : 'SELL 💰'
  }
  return "";
};

const getTransaction = async (txn, wallet) => {
  try {
    //setting data to export information
    let data_export = {};
    //setting txn link
    data_export.txn_link = "https://solscan.io/tx/" + txn;
    data_export.error = false;
    data_export.wallet_address = wallet;
    //getting information transaction
    let transactionDetail = await solanaConnection.getParsedTransaction(txn, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    //getting and setting transaction time
    try {
      const date = convertTZ(
        new Date(transactionDetail.blockTime * 1000),
        "Asia/Jakarta"
      )
        .toISOString()
        .replace(/T/, " ") // replace T with a space
        .replace(/\..+/, "");
      data_export.time = date;
    } catch {
      const date = convertTZ(new Date(), "Asia/Jakarta")
        .toISOString()
        .replace(/T/, " ") // replace T with a space
        .replace(/\..+/, "");
      data_export.time = "T:" + date;
    }

    let chkFip =
      transactionDetail != null
        ? transactionDetail.transaction.message.accountKeys.filter(
          (x) => x.pubkey.toString() == wallet_Fip
        )
        : null;
    //console.log('chkFip : ', chkFip != null ? chkFip.length : 0);

    //setting status
    transactionDetail.meta.err
      ? (data_export.status = "Failed")
      : (data_export.status = "Success");
    //check status : fail
    if (
      data_export.status != "Failed" &&
      (chkFip == null || chkFip.length == 0)
    ) {
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
      //For checking NFT Market
      const staticAccountKeys =
        transactionDetail.transaction.message.accountKeys.map((x) =>
          x.pubkey.toString()
        );
      const NFTmarketPlace = await inferMarketPlace(staticAccountKeys);
      console.log("marketPlace:", NFTmarketPlace);
      if (NFTmarketPlace != null) {
        data_export.market = NFTmarketPlace;
        data_export.type = "NFT";
        let mintToken = postTokenBalances[0]?.mint;
        if (mintToken == null || mintToken == undefined) {
          if (staticAccountKeys != null && staticAccountKeys.length != 0)
            mintToken = staticAccountKeys[3]
        }
        //
        if (mintToken != null) {

          const price =
            Math.abs(preBalances[0] - postBalances[0]) /
            solanaWeb3.LAMPORTS_PER_SOL;

          let tradeDirection = "";
          tradeDirection = inferTradeDirection(
            wallet,
            transactionDetail.meta.logMessages,
            preTokenBalances,
            postTokenBalances
          );

          console.log('mintToken:', mintToken)
          const metadata = await getTokenMeta(mintToken);
          console.log('metadata:', metadata)
          data_export.nftMeta = {
            name: metadata.name,
            tradeDirection,
            price: price,
            image: metadata.uri,
            transactionDate: data_export.time,
            marketPlaceURL: `${NFTmarketPlace.url}/${mintToken}`,
          };

          return data_export;
        } else return null;
      } else {
        data_export.market = null;
        data_export.type = "Token";
      }

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
      } else {
        if (sol_data == null) console.error("txn : sol data is null");
        else console.error("txn : SPL data is null !!");
        return null;
      }
      return data_export;
    } else if (chkFip != null && chkFip.length != 0) {
      console.error("txn : play_flipgg transaction....");
      return null;
    } else {
      console.error("txn : faild !!");
      return null;
    }
  } catch (e) {
    console.error("catch : ", e);
    return null;
  }
};
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
(async () => {
  const wallet_list = lstWallet;

  wallet_list.forEach((prop, index) => {
    const pubKey = new solanaWeb3.PublicKey(prop.address);
    console.log(
      "start wallet [" + (index + 1) + "] " + prop.name + " : ",
      prop.address
    );
    solanaConnection.onAccountChange(
      new solanaWeb3.PublicKey(pubKey),
      async (updatedAccountInfo, context) => {
        await delay(3000);
        const signatures = await solanaConnection.getSignaturesForAddress(
          pubKey,
          { limit: 1 },
          "finalized"
        );
        signatures.forEach((x) => {
          console.log(prop.name + " actived..");
          console.log("link : ", "https://solscan.io/tx/" + x.signature);
        });
        let dataE = await getTransaction(signatures[0].signature, prop.address);
        if (dataE != null && dataE.error != true) {
          console.log("Time : ", dataE.time);
          if (dataE.type == "Token") {
            if (dataE.qtyIn != null && dataE.qtyIn != 0 && dataE.qtyIn < 0.1) {
              let dataSend = await sendData(prop.name, dataE);
              lineSendMessage(dataSend);
              console.log("");
            } else console.log("QTY IN = 0 is not sawp transaction...");
          } else {
            if (dataE.nftMeta != null && dataE.nftMeta.tradeDirection != "") {
              let dataSend = await sendDataNFT(prop.name, dataE);
              lineSendMessageNFT(dataSend);
              console.log("");
            } else console.log("tradeDirection is not clear....");
          }
          console.log("");
        }
        console.log("");
      },
      "finalized"
    );
  });
})();
