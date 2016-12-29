var logger = new Logger('collections:DocumentManager');

Logger.setLevel('collections:DocumentManager', 'trace');
// Logger.setLevel('collections:DocumentManager', 'debug');
// Logger.setLevel('collections:DocumentManager', 'info');
// Logger.setLevel('collections:DocumentManager', 'warn');

Documents = new Mongo.Collection('documents');
Summaries = new Mongo.Collection('summaries');

Document = function(fileName) {

    this.fileName = fileName;

    this.title = ""

    // array of sentence IDs
    this.sentences = [];

    // array of userIDs that have seen this document
    // and made at least one annotation
    this.annotatedBy = [];

    // array of summary IDs
    this.summaries = [];

    this.content = "";

    this.matchIDs = [];
}

Summary = function(doc, sumType, content, user) {

    this.docID = doc._id;

    this.sumType = sumType;

    this.content = content;

    this.userID = user._id;
}

DocumentManager = (function() {
    return {
        sampleDocument: function() {
            /******************************************************************
             * Sample a document for a given user to annotate
             * and make sure that the document hasn't been annotated
             * by that person already
             * @params
             *    userID - the id of the user we want to serve
             *****************************************************************/
            var user = Session.get("currentUser");
            var currentDoc = Session.get("currentDoc");
            var documents;
            if (currentDoc) {
                documents = Documents.find({annotatedBy: {$ne: user._id},
                                            fileName: {$in: toSample},
                                            _id: {$ne: currentDoc._id}}).fetch();
                if (documents.length < 1) {
                    documents = Documents.find({annotatedBy: {$ne: user._id},
                                                _id: {$ne: currentDoc._id}}).fetch();
                }
            } else {
                documents = Documents.find({annotatedBy: {$ne: user._id},
                                            fileName: {$in: toSample}}).fetch();
                if (documents.length < 1) {
                    documents = Documents.find({annotatedBy: {$ne: user._id}}).fetch();
                }
            }
            logger.debug(documents.length + " remaining possible documents to sample from");
            return getRandomElement(documents);
            // indices = []
            // documents.forEach(function(doc) {
            //     indices.push({'index': documents.indexOf(doc),
            //                   'numAnnotations': doc.annotatedBy.length});
            // })
            // indices.sort(function(a, b) {return a.numAnnotations-b.numAnnotations});
            // logger.trace("Indices: " + JSON.stringify(indices));
            // for (i=0; i<indices.length; i++) {
            //     sampledDoc = documents[indices[i].index];
            //     logger.trace(JSON.stringify(sampledDoc));
            //     logger.trace("Sampled " + sampledDoc.title + " with " +
            //         sampledDoc.annotatedBy.length + " annotations");
            //     if (!isInList(userID, sampledDoc.annotatedBy)) {
            //         logger.debug("User hasn't seen this doc");
            //         break;
            //     } else {
            //         logger.debug("User has seen this doc");
            //     }
            // }
            // return sampledDoc;
            // var hasAnnotated = true;
            // do {
            //     var randDoc = getRandomElement(documents);
            //     if (!isInList(userID, randDoc.annotatedBy)) {
            //         hasAnnotated = false;
            //     }
            // } while (hasAnnotated);
            // return randDoc;
        },
        createDocument: function(docPackage) {
            /******************************************************************
             * Create a document
             * @params
             *    docPackage - a JSON object with fields "title" and
             *                 "sentences" (an array of sentences)
             *****************************************************************/
             var doc = new Document(docPackage.title);
             doc.content = docPackage.sentences.join(" ");
             doc.title = docPackage.firstLine;
             doc.allwords = docPackage.allwords;
             doc.sentences = docPackage.sentences;
             doc.extID = docPackage.extID;
             var docID = Documents.insert(doc);
             // var seq = 1;
             // docPackage.sentences.forEach(function(sentence) {
                // SentenceFactory.createSentence(docID, sentence, seq);
                // seq += 1;
             // });
        },
        updateDocument: function(docPackage) {
            // hack for now to add new metadata to docs
            var doc = Documents.findOne({fileName: docPackage.title});
            Documents.update({_id: doc._id},
                             {$set: {allwords: docPackage.allwords}});
        },
        addSummary: function(doc, sumType, content, user) {
            var summary = new Summary(doc, sumType, content, user);
            sumID = Summaries.insert(summary);
            Documents.update({_id: doc._id}, {$addToSet: {summaries: sumID}});
        },
        isAnnotatedBy: function(doc, user) {
            var docWords = Words.find({docID: doc._id}).fetch();

            var hasPurpose = false;
            var hasMechanism = false;
            docWords.forEach(function(docWord) {
                if (isInList(user._id, docWord.highlightsPurpose)) {
                    hasPurpose = true;
                }
                if (isInList(user._id, docWord.highlightsMechanism)) {
                    hasMechanism = true;
                }
            });

            if (hasPurpose && hasMechanism) {
                return true;
            } else {
                return false;
            }
        },
        markAnnotatedBy: function(doc, user) {
            Documents.update({_id: doc._id},
                            {$addToSet: {annotatedBy: user._id}});
        }
    }
}());

var toSample = ["1139141.txt",
                "1140587.txt",
                "1141309.txt",
                "1141983.txt",
                "1142504.txt",
                "1142540.txt",
                "1142594.txt",
                "1142597.txt",
                "1147061.txt",
                "1147696.txt",
                "1148784.txt",
                "1149483.txt",
                "1150195.txt",
                "1150559.txt",
                "1152143.txt",
                "1154133.txt",
                "1154579.txt",
                "1154615.txt",
                "1155779.txt",
                "1157947.txt"]
