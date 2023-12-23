const request = require("request");
const url_line_notification = "https://notify-api.line.me/api/notify";
const CoinGeckoClient = require("coingecko-api-v3");
const axios = require("axios");
/*
    format
      data_export.tokenIn = inToken.token.name;
      data_export.qtyIn = inToken.tokenChange;
      data_export.tokenIn_info = inToken.token;

      data_export.tokenOut = outToken.token.name;
      data_export.qtyOut = outToken.tokenChange;
      data_export.tokenOut_info = outToken.token;
*/

function numberCmp(value) {
  const usformatter = Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  });
  return usformatter.format(value);
}

const getImage = async (url) => {
  try {
    const res = await axios.get(url);
    return res.data;
  } catch {
    return null;
  }
};

const calPrice = async (inSymbol, inQty, outSymbol, outQty) => {
  const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true });
  const solanaPrice = await cgc.simplePrice({
    vs_currencies: "usd",
    ids: "solana",
  });
  const priceUSD = solanaPrice.solana.usd;

  if (inSymbol == "SOL" || outSymbol == "SOL") {
    if (inSymbol == "SOL")
      return (
        "Price: 1 " +
        outSymbol +
        " ≈ " +
        Math.abs((inQty * priceUSD) / outQty) +
        " USDC"
      );
    else {
      console.info("qtyIn : ", inQty);
      console.info("outQty : ", outQty);
      console.info("priceUSD : ", outQty * priceUSD);
      console.info("s : ", Math.abs((inQty / outQty) * priceUSD));
      return (
        "Price: 1 " +
        outSymbol +
        " ≈ " +
        Math.abs((inQty / outQty) * priceUSD) +
        " USDC"
      );
    }
  } else if (inSymbol == "USDC" || outQty == "USDC") {
    if (inSymbol == "USDC")
      return (
        "Price: 1 " + outSymbol + " ≈ " + Math.abs(inQty / outQty) + " USDC"
      );
    else
      return (
        "Price:1 " + outSymbol + " ≈ " + Math.abs(inQty / outQty) + " USDC"
      );
  }
};

const calTokenPrice = async (tokenIn, qtyIn, tokenOut, qtyOut) => {
  const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true, });
  const solanaPrice = await cgc.simplePrice({
    vs_currencies: 'usd',
    ids: 'solana',
  })
  const priceSol2USD = solanaPrice.solana.usd
  if (tokenIn == "SOL" || tokenOut == "SOL") {
    let USDValue = (tokenIn == "SOL" ? qtyIn * priceSol2USD : qtyOut * priceSol2USD);
    if (tokenIn == "SOL")
      return Number.parseFloat(USDValue / qtyOut).toFixed(7);
    else
      return Number.parseFloat(USDValue / qtyIn).toFixed(7);
  } // Calculate by USD
  else if (tokenIn.includes('USD') || tokenOut.includes('USD')) {
    if (tokenIn.includes('USD'))
      return Number.parseFloat(qtyIn / qtyOut).toFixed(7);
    else
      return Number.parseFloat(qtyOut / qtyIn).toFixed(7);
  } else if ((tokenIn == "SOL" && tokenOut.includes('USD')) ||
    (tokenOut == "SOL" && tokenIn.includes('USD'))) {
    return priceSol2USD;
  } else
    return null;
}

const genLinkJUP = async (tokenIn, tokenOut, tokenIn_info, tokenOut_info) => {
  try {
    if (tokenIn == "SOL") {
      if (tokenOut_info != null && !tokenOut.includes('USD'))
        return 'https://jup.ag/swap/SOL-' + tokenOut_info.symbol + '_' + tokenOut_info.address;
      else
        return null;
    } else if (tokenOut == "SOL") {
      if (tokenIn_info != null && !tokenIn.includes('USD'))
        return 'https://jup.ag/swap/SOL-' + tokenIn_info.symbol + '_' + tokenIn_info.address;
      else
        return null;
    }
  } catch {
    return null;
  }
}

const genDexscreener = async (tokenAddress, markerWallet) => {
  try {
    return 'https://dexscreener.com/solana/' + tokenAddress + '?maker=' + markerWallet
  } catch {
    return '';
  }
}

const sendData = async (name, data_export) => {
  try {
    let rugCheck = "https://rugcheck.xyz/tokens/";
    let bird = "https://birdeye.so/token/";
    let buy_jup = "https://jup.ag/swap/";
    let buy_ray = "https://raydium.io/swap/?inputCurrency=sol&outputCurrency=";

    let priceToken2USD = await calTokenPrice(data_export.tokenIn, data_export.qtyIn
      , data_export.tokenOut, data_export.qtyOut);

    let jup_link = await genLinkJUP(data_export.tokenIn, data_export.tokenOut
      , data_export.tokenIn_info, data_export.tokenOut_info);
    let dex_link = await genDexscreener((data_export.tokenIn.includes('SOL') || data_export.tokenIn.includes('USD')
      ? data_export.tokenOut_info.address : data_export.tokenIn_info.address), data_export.wallet_address)
    //Test
    console.log('jup_link :', jup_link)
    //jup_link

    let message =
      name + "\n" +
      "Mode : SWAP 📈" + "\n" +
      "In : " + numberCmp(Math.abs(data_export.qtyIn)) +
      (data_export.tokenIn != "SOL" ? "-" + data_export.tokenIn_info.symbol : "◎") +
      "\n" +
      "Out : " + numberCmp(data_export.qtyOut) +
      (data_export.tokenOut != "SOL" ? "-" + data_export.tokenOut_info.symbol : "◎") +
      "\n" +
      "Price ≈ " + (priceToken2USD == null ? 'N/A' : Math.abs(priceToken2USD)) + " USD \n" +
      "Time : " + data_export.time + "\n" +
      "\n" +
      "External Link : \n" +
      (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin"
        ? "Check : " + rugCheck + data_export.tokenIn_info.address + "\n"
        : "") +
      (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin"
        ? "Check : " + rugCheck + data_export.tokenOut_info.address + "\n"
        : "") + 'Chart :' + (dex_link) + '\n' +
      //Jup
      (jup_link != null ? 'Buy : ' + jup_link : '') + "\n" +
      "txn : " +
      data_export.txn_link +
      "\n";
    //https://jup.ag/swap/KPOP_DcUoGUeNTLhhzyrcz49LE7z3MEFwca2N9uSw1xbVi1gm-SOL
    return message;
  } catch (err) {
    console.error("Error format message:", err);
    return null;
  }
};

const sendDataNFT = async (name, data_export) => {
  try {
    /*  name: metadata.name,
          tradeDirection,
          price: price,
          priceUSD: priceUSD,
          image: metadata.image,
          transactionDate: data_export.time,
          marketPlaceURL: `${marketPlaceNFT.url}/${mintToken}`,
       */
    if (data_export.nftMeta != null) {
      let dataMeta = await getImage(data_export.nftMeta.image);
      const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true });
      const solanaPrice = await cgc.simplePrice({
        vs_currencies: "usd",
        ids: "solana",
      });
      const priceUSD = solanaPrice.solana.usd * data_export.nftMeta.price;

      let message =

        name + "\n" + "Mode : " + data_export.nftMeta.tradeDirection + "\n" +
        "time : " + data_export.time + "\n" +
        "NFT : " + data_export.nftMeta.name + "\n" +
        "Price : " + data_export.nftMeta.price.toFixed(2) + "◎\n" +
        "\n" +
        "External Link\n" +
        "mk : " + data_export.nftMeta.marketPlaceURL + "\n" +
        "txn : " + data_export.txn_link + "\n";
      return message;
    } else {
      return "";
    }
  } catch (err) {
    console.error("Error format message:", err);
    return null;
  }
};

const lineSendMessage = async (msg) => {
  request(
    {
      method: "POST",
      uri: url_line_notification,
      header: {
        "Content-Type": "multipart/form-data",
      },
      auth: {
        bearer: "GSf0kcbCGG2XawAENFxIPDFjIELfqQ9bnE3InE7LNDb",
      },
      form: {
        message: msg,
      },
    },
    (err, httpResponse, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Complete send message...");
      }
    }
  );
};

const lineSendMessageNFT = async (msg) => {
  request(
    {
      method: "POST",
      uri: url_line_notification,
      header: {
        "Content-Type": "multipart/form-data",
      },
      auth: {
        bearer: "LWv6cObZz7pQ0wfqA9XYjRvLsieKezLI1D6WEFVy96J",
      },
      form: {
        message: msg,
      },
    },
    (err, httpResponse, body) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Complete send message...");
      }
    }
  );
};

exports.sendData = sendData;
exports.sendDataNFT = sendDataNFT;
exports.lineSendMessage = lineSendMessage;
exports.lineSendMessageNFT = lineSendMessageNFT;