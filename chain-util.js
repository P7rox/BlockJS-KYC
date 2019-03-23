const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');
const uuidV1 = require('uuid/v1');
const uuidV5 = require('uuid/v5');
const Store = require('data-store');
const crypto = require('crypto');
const ecdsa = require('ecdsa');
const sr = require('secure-random');
const CoinKey = require('coinkey');
const secp256k1 = require('secp256k1');
const { randomBytes } = require('crypto')

const ec = new EC('secp256k1');
const store = new Store({ name: 'wallet', path: './savedwallet' });


class ChainUtil {
    static genKeyPair(privateKey) { 
        return new CoinKey(privateKey, true);
        // return ec.genKeyPair();
    }

    static genPrivateKey() {
        let privKey
        do {
        privKey = randomBytes(32)
        } while (!secp256k1.privateKeyVerify(privKey))
        return privKey;
        // return sr.randomBuffer(32);
    }

    static genPublicKey(privKey) {
        return secp256k1.publicKeyCreate(privKey);
    }

    static id() {
        return uuidV1();
    }

    static docId( string ) {
        const uuid_base = uuidV5('https://p7rox.github.io/', uuidV5.DNS );
        const uuid_document = uuidV5('document', uuid_base );
        return uuidV5( string, uuid_document );
    }

    static hash(data) {
        const msg = new Buffer.from(JSON.stringify(data), 'utf8')
        return crypto.createHash('sha256').update(msg).digest().toString('hex');
        // return SHA256(JSON.stringify(data)).toString();
    }

    static genSignature(dataHash, privKey) {
        return secp256k1.sign(Buffer.from(dataHash, 'hex'), privKey).signature;
    }

    static verifySignature(publicKey, signature, dataHash) {
        return secp256k1.verify(Buffer.from(dataHash, 'hex'),Buffer.from(signature, 'hex'), Buffer.from(publicKey, 'hex'));
        // return ecdsa.verify(dataHash, signature, publicKey)
        // return ec.keyFromPublic(publicKey, 'hex').verify(dataHash, signature);
    }

    static walletObject( freshWallet ) {
        let wallet;
        if(store.get('a')){
            wallet = store.get('a');
        } else {
            store.set('a',freshWallet);
            store.save();
            wallet = freshWallet;
        }
        return wallet;
    }
}


module.exports = ChainUtil;