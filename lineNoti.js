const request = require("request");
const url_line_notification = "https://notify-api.line.me/api/notify";

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

const sendData = async (name, data_export) => {
    let rugCheck = "https://rugcheck.xyz/tokens/";
    let bird = "https://birdeye.so/token/";

    let message = "\n" + "Whale : " + name + "\n"
        + "mode : Swapping" + "\n"
        + "token-IN : " + data_export.tokenIn + "\n"
        + "amount : " + numberCmp(Math.abs(data_export.qtyIn)) + "-" + (data_export.tokenIn != "SOL" ? data_export.tokenIn_info.symbol : '◎') + "\n"
        + "==========================" + "\n"
        + "token-Out : " + data_export.tokenOut + "\n"
        + "amount : " + numberCmp(data_export.qtyOut) + "-" + (data_export.tokenOut != "SOL" ? data_export.tokenOut_info.symbol : '◎') + "\n"
        + "==========================" + "\n"

        + "Price : " + (Math.abs(data_export.qtyOut) / Math.abs(data_export.qtyIn)).toFixed(2) + "\n"
        + "\n"
        + "External Link : \n"
        + (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin" ? 'Check : ' + rugCheck + data_export.tokenIn_info.address + "\n" : '')
        + (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin" ? 'Check : ' + rugCheck + data_export.tokenOut_info.address + "\n" : '')
        + (data_export.tokenIn != "SOL" && data_export.tokenIn != "USD Coin" ? 'Chart : ' + bird + data_export.tokenIn_info.address + "\n" : '')
        + (data_export.tokenOut != "SOL" && data_export.tokenOut != "USD Coin" ? 'Chart : ' + bird + data_export.tokenOut_info.address + "\n" : '')
        + "txn : " + data_export.txn_link + "\n";

    return message
}

const lineSendMessage = async (msg) => {
    request(
        {
            method: "POST",
            uri: url_line_notification,
            header: {
                "Content-Type": "multipart/form-data",
            },
            auth: {
                bearer: 'gAT6jeg1jBuvM9OYK7fVs7jX8exbfew436ZsSST5qN3'
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

exports.sendData = sendData
exports.lineSendMessage = lineSendMessage