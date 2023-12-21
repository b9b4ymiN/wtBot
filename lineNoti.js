const request = require("request");
const url_line_notification = "https://notify-api.line.me/api/notify";
const CoinGeckoClient = require('coingecko-api-v3')
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

const calPrice = async (inSymbol, inQty, outSymbol, outQty) => {
  const cgc = new CoinGeckoClient.CoinGeckoClient({ autoRetry: true, });
  const solanaPrice = await cgc.simplePrice({
    vs_currencies: 'usd',
    ids: 'solana',
  })
  const priceUSD = solanaPrice.solana.usd

  if (inSymbol == 'SOL' || outSymbol == 'SOL') {
    if (inSymbol == 'SOL')
      return 'Price: 1 ' + outSymbol + " ≈ " + Math.abs(inQty * priceUSD / outQty) + ' USDC'
    else {
      console.info('qtyIn : ', inQty)
      console.info('outQty : ', outQty)
      console.info('priceUSD : ', outQty * priceUSD)
      console.info('s : ', Math.abs(inQty / outQty * priceUSD))
      return 'Price: 1 ' + outSymbol + " ≈ " + Math.abs(inQty / outQty * priceUSD) + ' USDC'
    }
  } else if (inSymbol == 'USDC' || outQty == 'USDC') {
    if (inSymbol == 'USDC')
      return 'Price: 1 ' + outSymbol + " ≈ " + Math.abs(inQty / outQty) + ' USDC'
    else
      return 'Price:1 ' + outSymbol + " ≈ " + Math.abs(inQty / outQty) + ' USDC'
  }

}

const sendData = async (name, data_export) => {
  try {
    let rugCheck = "https://rugcheck.xyz/tokens/";
    let bird = "https://birdeye.so/token/";
    let buy_jup = "https://jup.ag/swap/";
    let buy_ray = "https://raydium.io/swap/?inputCurrency=sol&outputCurrency=";

    let priceStr = await calPrice(data_export.tokenIn_info ? data_export.tokenIn_info.symbol : 'SOL', data_export.qtyIn
      , data_export.tokenOut_info ? data_export.tokenOut_info.symbol : 'SOL', data_export.qtyOut,)

    let message =
      "\n" +
      "Whale : " +
      name +
      "\n" +
      "mode : Swapping" +
      "\n" +
      "time : " +
      data_export.time +
      "\n" +
      "==========================" +
      "\n" +
      "token-IN : " +
      data_export.tokenIn +
      "\n" +
      "amount : " +
      numberCmp(Math.abs(data_export.qtyIn)) +
      "-" +
      (data_export.tokenIn != "SOL" ? data_export.tokenIn_info.symbol : "◎") +
      "\n" +
      "==========================" +
      "\n" +
      "token-Out : " +
      data_export.tokenOut +
      "\n" +
      "amount : " +
      numberCmp(data_export.qtyOut) +
      "-" +
      (data_export.tokenOut != "SOL" ? data_export.tokenOut_info.symbol : "◎") +
      "\n" +
      "==========================" +
      //"\n" + priceStr +
      "\n" +
      "External Link : \n" +
      (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin"
        ? "Check : " + rugCheck + data_export.tokenIn_info.address + "\n"
        : "") +
      (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin"
        ? "Check : " + rugCheck + data_export.tokenOut_info.address + "\n"
        : "") +
      (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin"
        ? "Chart : " + bird + data_export.tokenIn_info.address + "\n"
        : "") +
      (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin"
        ? "Chart : " + bird + data_export.tokenOut_info.address + "\n"
        : "") +
      (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin"
        ? "Buy : " + buy_jup + data_export.tokenOut_info.address + "-SOL \n"
        : "") +
      (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin"
        ? "Buy : " + buy_jup + data_export.tokenIn_info.address + "-SOL \n"
        : "") +
      ///Raydium
      (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin"
        ? "Buy : " + buy_ray + data_export.tokenOut_info.address + " \n"
        : "") +
      (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin"
        ? "Buy : " + buy_ray + data_export.tokenIn_info.address + " \n"
        : "") +
      "txn : " +
      data_export.txn_link +
      "\n";
    //https://jup.ag/swap/KPOP_DcUoGUeNTLhhzyrcz49LE7z3MEFwca2N9uSw1xbVi1gm-SOL
    return message;
  } catch (err) {
    console.error('Error format message:', err)
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
      let message =
        "\n" +
        "Whale : " +
        name +
        "\n" +
        "mode : " + data_export.nftMeta.tradeDirection +
        "\n" +
        "time : " +
        data_export.time +
        "\n" +
        "==========================" +
        "NFT:" + data_export.nftMeta.name + "\n" +
        "Image:" + data_export.nftMeta.image + "\n" +
        "==========================" +
        "\n" +
        "Price : " + data_export.nftMeta.price +
        "\n" +
        "\n" +
        "External Link : \n" +
        "txn : " +
        data_export.nftMeta.marketPlaceURL + "\n";
      return message;
    } else {
      return "";
    }

  } catch (err) {
    console.error('Error format message:', err)
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
        bearer: "gAT6jeg1jBuvM9OYK7fVs7jX8exbfew436ZsSST5qN3",
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
