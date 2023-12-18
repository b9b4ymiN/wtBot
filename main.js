const solanaWeb3 = require('@solana/web3.js');
const searchAddress = 'GSE6vfr6vws493G22jfwCU6Zawh3dfvSYXYQqKhFsBwe'; //example 'pow'

const endpoint = 'https://quiet-attentive-hexagon.solana-mainnet.quiknode.pro/208df33f2dae1636a4bd50fdb510d37e4171d6b2/';
const solanaConnection = new solanaWeb3.Connection(endpoint);


const getTransactions = async (address, numTx) => {
    const pubKey = new solanaWeb3.PublicKey(address);
    let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, { limit: numTx });

    let signatureList = transactionList.map(transaction => transaction.signature); // Getting tx hash id ==> for query next time
    let transactionDetails = await solanaConnection.getParsedTransactions(signatureList, { maxSupportedTransactionVersion: 0 });

    transactionList.forEach((transaction, i) => {

        const date = new Date(transaction.blockTime * 1000);
        const transactionInstructions = transactionDetails[i].transaction.message.instructions;
        console.log(`Transaction No: ${i + 1}`);
        console.log(`Signature: ${transaction.signature}`);
        console.log(`Time: ${date}`);
        console.log(`Status: ${transaction.confirmationStatus}`);
        //console.log(`data:`, transactionDetails[i].meta.innerInstructions);

        transactionDetails[i].meta.err ? console.log(`Status: Failed`) : console.log(`Status: Success`)

        let { preTokenBalances, postTokenBalances } = transactionDetails[i].meta;

        console.log(`   ${'Item'.padEnd(8)} ` +
            `${'owner'.padEnd(45)} ` +
            `${'mint'.padEnd(45)} ` +
            `${'tokenChange'.padEnd(45)} ` +
            `${'post'.padEnd(45)} `
        );
        preTokenBalances.filter(x => x.owner == searchAddress).forEach((account, i) => {
            let tokenChange = (postTokenBalances[i].uiTokenAmount.uiAmount - account.uiTokenAmount.uiAmount);
            /*
              <td className="px-6 py-3">{i+1}</td>
                        <td className="px-6 py-3">{account.owner}</td>
                        <td className="px-6 py-3">{account.mint}</td>                        
                        <td className="px-6 py-3 text-center">{tokenChange === 0 ? '-' : tokenChange.toFixed(2)}</td>
                        <td className="px-6 py-3 text-center">{postTokenBalances[i].uiTokenAmount.uiAmount ? (postTokenBalances[i].uiTokenAmount.uiAmount).toFixed(2): '-'}</td>
            
            */
            console.log(`   ${i.toString().padEnd(8)} ` +
                `${account.owner.padEnd(45)} ` +
                `${account.mint.padEnd(45)} ` +
                `${(tokenChange === 0 ? '-' : tokenChange.toFixed(2)).padEnd(45)} ` +
                `${(postTokenBalances[i].uiTokenAmount.uiAmount ? (postTokenBalances[i].uiTokenAmount.uiAmount).toFixed(2) : '-').padEnd(45)} `
            );

        })


        console.log((""));
        console.log(`   ${'Item'.padEnd(8)} ` +
            `${'owner'.padEnd(45)} ` +

            `${'tokenChange'.padEnd(45)} ` +
            `${'post'.padEnd(45)} `
        );
        let { preBalances, postBalances } = transactionDetails[i].meta;
        transactionDetails[i].transaction.message.accountKeys.filter(x => x.pubkey.toString() == searchAddress).forEach((account, i) => {
            let solChange = (postBalances[i] - preBalances[i]) / solanaWeb3.LAMPORTS_PER_SOL;
            console.log(`   ${i.toString().padEnd(8)} ` +
                `${account.pubkey.toString()} ` +
                `${(solChange === 0 ? '-' : solChange.toFixed(2)).padEnd(45)} ` +
                `${'◎' + ((postBalances[i] / solanaWeb3.LAMPORTS_PER_SOL).toFixed(3))} `
            );
        })


        console.log(("-").repeat(100));
    })
}

getTransactions(searchAddress, 1);