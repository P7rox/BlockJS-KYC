const ChainUtil = require('../chain-util');
const Transaction = require('./transaction');
const { INITIAL_BALANCE } = require('../config');

class Wallet {
    constructor(wallet) {
        if(wallet === undefined ) {
            this.balance = INITIAL_BALANCE;
            this.privateKey = ChainUtil.genPrivateKey().toString('hex');
            this.publicKey = ChainUtil.genPublicKey(Buffer.from(this.privateKey, 'hex')).toString('hex');
        }
        else {
            const { balance, privateKey } = wallet;
            this.balance = balance;
            this.privateKey = privateKey;
            this.publicKey = ChainUtil.genPublicKey(Buffer.from(this.privateKey, 'hex')).toString('hex');
        }
    }

    toString() {
        return `Wallet -
            publicKey: ${this.publicKey.toString()}
            balance  : ${this.balance}`
    }

    sign(dataHash) {
        return ChainUtil.genSignature(dataHash, Buffer.from(this.privateKey, 'hex')).toString('hex');
        // return ecdsa.sign(dataHash, this.privateKey);
        // return this.keyPair.sign(dataHash);
    }

    createTransaction(recipient, amount, docName, docIpfsHash, docType, verifier, typeFlag, blockchain, transactionPool) {
        this.balance = this.calculateBalance(blockchain);

        if(amount > this.balance) {
            console.log(`Amount: ${amount} exceeds current balance: ${this.balance}.`);
            return;
        }

        let transaction = transactionPool.existingTransaction(this.publicKey);

        if (transaction) {
            transaction.update(this, recipient, amount, docName, docIpfsHash, docType, verifier, typeFlag );
        } else {
            transaction = Transaction.newTransaction(this, recipient, amount, docName, docIpfsHash, docType, verifier, typeFlag);
            transactionPool.updateOrAddTransaction(transaction);
        }

        return transaction;
    }

    calculateBalance(blockchain) {
        let balance = this.balance;
        let transactions = [];
        blockchain.chain.forEach(block => block.data.forEach(transaction => {
            transactions.push(transaction);
        }));

        const walletInputTs = transactions
            .filter(transaction => transaction.input.address === this.publicKey);

        let startTime = 0;

        if(walletInputTs.length > 0) {
            const recentInputT = walletInputTs.reduce(
                (prev, current) => prev.input.timestamp > current.input.timestamp ? prev : current
            );

            balance = recentInputT.outputs.payment.find(output => output.address === this.publicKey).amount;
            startTime = recentInputT.input.timestamp;
        }

        transactions.forEach(transaction => {
           if (transaction.input.timestamp > startTime) {
               transaction.outputs.payment.find(output => {
                   if (output.address === this.publicKey) {
                       balance += output.amount;
                   }
               });
           } 
        });

        return balance;
    }

    static blockchainWallet() {
        const blockchainWallet = new this();
        blockchainWallet.address = 'blockchain-wallet';
        return blockchainWallet;
    }
}

module.exports = Wallet;