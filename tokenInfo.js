const solanaWeb3 = require('@solana/web3.js');
const metadata = require('@metaplex-foundation/mpl-token-metadata');


// NFT is a mint. just like SRM, USDC ..., the only different is that NFT's supply is 1
//
// if we want to get NFT's metadata, first we need to know what is the mint address.
// here I take a random DAPE as an example
// https://explorer.solana.com/address/9MwGzSyuQRqmBHqmYwE6wbP3vzRBj4WWiYxWns3rkR7A
//
// tokenmeta is a PDA a which derived by mint address
// the formula is ['metadata', metadata_program_id, mint_id]
// is it totally fine to forget it because sdk already wrapped it for us

const endpoint = 'https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/';
const solanaConnection = new solanaWeb3.Connection(endpoint);

(async () => {
    const mpl = new getpdf();
    const mintPubkey = new solanaWeb3.PublicKey("6CNHDCzD5RkvBWxxyokQQNQPjFWgoHF94D7BmC73X6ZK");
    let tokenmetaPubkey = await mpl.getPDA(mintPubkey);

    const tokenmeta = await mpl.load(solanaConnection, tokenmetaPubkey);
    console.log(tokenmeta);
})();