class DocumentParser {
    constructor(blockchain, wallet) {
        this.blockchain = blockchain;
        this.wallet = wallet;
        this.mySubmittedDocument = [];
        this.myVerifiedDocument = [];
        this.toVerifyDocument = [];
        this.myDocument = [];
    }

    verifier() {
        this.listDocument();
        let document = this.copyDocArray(this.toVerifyDocument, this.myVerifiedDocument);
        console.log(document);
        return {
            document,
            // toVerify: this.toVerifyDocument,
            // verified: this.myVerifiedDocument,
        };
    }

    client() {
        this.listDocument();
        let document = this.copyDocArray(this.mySubmittedDocument, this.myDocument);
        return {
            document,
            // mySubmitted: this.mySubmittedDocument,
            // myVerified: this.myDocument,
        };
    }

    clearDocumentArray() {
        this.mySubmittedDocument = [];
        this.myVerifiedDocument = [];
        this.toVerifyDocument = [];
        this.myDocument = [];
    }

    copyDocArray(myDocArray, verifiedArray) {
        let newDocArray = [];
        myDocArray.forEach(document => {
            if( verifiedArray.some( doc => doc.documentId === document.documentId )) {
                newDocArray.push({
                    "documentId": document.documentId,
                    "documentName": document.documentName,
                    "documentAddress": document.documentAddress,
                    "docType": document.docType,
                    "status": "verified",
                });
            } else {
                newDocArray.push({
                    "documentId": document.documentId,
                    "documentName": document.documentName,
                    "documentAddress": document.documentAddress,
                    "docType": document.docType,
                    "status": "pending",
                });
            }
        });
        return newDocArray;
    }

    listDocument() {
        this.clearDocumentArray();
        let transactions = [];
        this.blockchain.chain.forEach(block => block.data.forEach(transaction => {
            transactions.push(transaction);
            if( transaction.input.address === this.wallet.publicKey ){
                transaction.outputs.document.forEach(document => {
                    if( document.addressType === "verifier" ){
                        this.mySubmittedDocument.push(document);
                    } else if (document.addressType === "client" ) {
                        this.myVerifiedDocument.push(document);
                    }
                })
            }
        }));
        transactions.forEach(transaction => transaction.outputs.document.forEach(document => {  
            if( document.address === this.wallet.publicKey ){
                if( document.addressType === "verifier" ){
                    this.toVerifyDocument.push(document);
                } else if (document.addressType === "client" ) {
                    this.myDocument.push(document);
                }
            }
        }));
    }
}

module.exports = DocumentParser;