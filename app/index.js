const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain');
const P2pServer = require('./p2p-server');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const Miner = require('./miner');
const DocumentParser = require('./document');
const ChainUtil = require('../chain-util');

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const freshWallet = new Wallet();
const tp = new TransactionPool();
const p2pServer = new P2pServer(bc, tp);
const wallet = new Wallet(ChainUtil.walletObject(freshWallet));
const miner = new Miner(bc, tp, wallet, p2pServer);
const documentParser = new DocumentParser(bc, wallet);

app.use(bodyParser.json());

app.get('/blocks', (req, res) => {
    res.json(bc.chain);
});

app.get('/wallet', (req, res) => {
    res.json(wallet);
});

app.post('/mine', (req, res) => {
    const block = bc.addBlock(req.body.data);
    console.log(`New block added: ${block.toString()}`);

    p2pServer.syncChains();

    res.redirect('/blocks');
});

app.post('/check-verification', (req, res) => {
    const { docName, docIpfsHash, docType } = req.body;
    const status = documentParser.checkVerification( docName, docIpfsHash, docType );
    res.json(status);
});

app.get('/transactions', (req, res) => {
    res.json(tp.transactions);
});

app.post('/transact', (req, res) => {
    const { recipient, amount,docName, docIpfsHash, docType, verifier, typeFlag } = req.body;
    const transaction = wallet.createTransaction(recipient, amount,docName, docIpfsHash, docType, verifier, typeFlag, bc, tp);
    p2pServer.broadcastTransaction(transaction);
    res.redirect('/transactions');
});

app.get('/mine-transactions', (req, res) => {
    const block = miner.mine();
    console.log(`New block added: ${block.toString()}`);
    res.redirect('/blocks');
});

app.get('/verifier', (req, res) => {
    doc = documentParser.verifier();
    res.json(doc);
});

app.get('/client', (req, res) => {
    doc = documentParser.client();
    res.json(doc);
});

app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey.toString('hex') });
});

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
p2pServer.listen();