const solanaWeb3 = require("@solana/web3.js");
const { programs } = require("@metaplex/js");
const {
  sendData,
  lineSendMessage,
  sendDataNFT,
  lineSendMessageNFT,
} = require("./lineNoti");
const {
  metadata: { Metadata },
} = programs;

const endpoint = "https://agace-p8zi4t-fast-mainnet.helius-rpc.com/";
const solanaConnection = new solanaWeb3.Connection(endpoint);

(async () => {
  solanaConnection.onAccountChange(
    new solanaWeb3.PublicKey(pubKey),
    async (updatedAccountInfo, context) => {
      await delay(3000);
    },
    "finalized"
  );
})();
