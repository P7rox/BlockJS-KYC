const ChainUtil = require('../chain-util');
const { MINING_REWARD } = require('../config');
class Transaction {
    constructor() {
        this.id = ChainUtil.id();
        this.input = null;
        this.outputs = {
            document:[],
            payment:[],
        }
    }

    update(senderWallet, recipient, amount, docName, docIpfsHash, docType, verifier, typeFlag) {
        const senderOutput = this.outputs.payment.find(output => output.address === senderWallet.publicKey);

        if(amount > senderOutput.amount) {
            console.log(`Amount: ${amount} exceeds balance.`);
            return;
        }

        senderOutput.amount = senderOutput.amount - amount;
        this.outputs.payment.push({ amount, address: recipient });
        if(typeFlag){
            this.outputs.document.push({ documentId: ChainUtil.docId(docIpfsHash+docType+docName), documentName: docName, documentAddress: docIpfsHash, docType, address: verifier, addressType: "verifier"});
        }else {
            this.outputs.document.push({ documentId: ChainUtil.docId(docIpfsHash+docType+docName), documentName: docName, documentAddress: docIpfsHash, docType, address: verifier, addressType: "client"});
        }
        Transaction.signTransaction(this, senderWallet);    

        return this;
    }

    static transactionWithOutputs(senderWallet, outputs, docDetail) {
        const transaction = new this();
        transaction.outputs.payment.push(...outputs);
        transaction.outputs.document.push(...docDetail);
        Transaction.signTransaction(transaction, senderWallet);
        return transaction;
    }

    static newTransaction(senderWallet, recipient, amount, docName, docIpfsHash, docType, verifier, typeFlag){
        

        if (amount > senderWallet.balance) {
            console.log(`Amount: ${amount} exceeds balance.`);
            return;
        }
        if(typeFlag){
            return Transaction.transactionWithOutputs(senderWallet, [
                { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
                { amount, address: recipient }
                ],[
                { documentId: ChainUtil.docId(docIpfsHash+docType+docName), documentName: docName, documentAddress: docIpfsHash, docType, address: verifier, addressType: "verifier"}
            ]);
        } else {
            return Transaction.transactionWithOutputs(senderWallet, [
                { amount: senderWallet.balance - amount, address: senderWallet.publicKey },
                { amount, address: recipient }
                ],[
                { documentId: ChainUtil.docId(docIpfsHash+docType+docName), documentName: docName, documentAddress: docIpfsHash, docType, address: verifier, addressType: "client"}
            ]);
        }
    }

    static rewardTransaction(minerWallet, blockchainWallet) {
        return Transaction.transactionWithOutputs(blockchainWallet, [{
            amount: MINING_REWARD, address: minerWallet.publicKey
        }], [])
    }

    static signTransaction(transaction, senderWallet) {
        transaction.input = {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.hash(transaction.outputs))
        }
    }

    static verifyTransaction(transaction) {
        return ChainUtil.verifySignature(
            transaction.input.address,
            transaction.input.signature,
            ChainUtil.hash(transaction.outputs)
        );
    }
}

module.exports = Transaction;