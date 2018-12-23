const fs = require('fs');
const expect = require('chai').expect;
const assert = require('assert');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

const Client = require('../target365-client.js');

/**
 * Reads key from file as a string
 *
 * @param path Path to a key
 * @returns Promise, which resolves to a key as a string
 */
const readKey = (path) => new Promise((resolve, reject) => {
	fs.readFile(path, 'utf8', (err, key) => resolve(key));
});

describe('', () => {
	let client;

	before(async () => {
		client = await Promise.all([readKey('./test/private.key'), readKey('./test/public.key')]).then(([ecPrivateKeyAsString, ecPublicKeyAsString]) => {
			return new Client(ecPrivateKeyAsString, {
				baseUrl: 'https://test.target365.io/',
				keyName: 'JavaSdkTest'
			})
		});
	});

	describe('Ping', () => {
		it('pong should be returned', () => {
			// Ping
			return client.ping().then((pong) => expect(pong).to.equal('pong'));
		});
	});

	describe('Keyword', () => {
		describe('Integration', () => {
			it('keyword should be created, updated and deleted', () => {
				let keyword = {
					shortNumberId: 'NO-0000',
					keywordText: 'node-sdk-test-keyword-text-0001',
					mode: 'Text',
					forwardUrl: 'https://www.node-sdk-test-keyword-text-0001.com',
					enabled: true
				};

				// Delete keyword if it exists (data cleanup)
				return client.getKeywords({ keywordText: keyword.keywordText })
					.then((keywords) => Promise.all(keywords.map(k => client.deleteKeyword(k.keywordId))))
					// Create keyword
					.then(() => client.postKeyword(keyword))
					.then((keywordId) => keyword.keywordId = keywordId)
					// Read keyword
					.then(() => client.getKeyword(keyword.keywordId))
					// Verify created keyword
					.then((created) => {
						expect(created.shortNumberId).to.equal(keyword.shortNumberId);
						expect(created.keywordText).to.equal(keyword.keywordText);
						expect(created.mode).to.equal(keyword.mode);
						expect(created.forwardUrl).to.equal(keyword.forwardUrl);
						expect(created.enabled).to.equal(keyword.enabled);
					})
					// Update keyword
					.then(() => client.putKeyword({ keywordId: keyword.keywordId, shortNumberId: keyword.shortNumberId,
						keywordText: keyword.keywordText, mode: keyword.mode, forwardUrl: keyword.forwardUrl + '-test', enabled: keyword.enabled }))
					// Read keyword
					.then(() => client.getKeyword(keyword.keywordId))
					// Verify updated keyword
					.then((updated) => {
						expect(updated.shortNumberId).to.equal(keyword.shortNumberId);
						expect(updated.keywordText).to.equal(keyword.keywordText);
						expect(updated.mode).to.equal(keyword.mode);
						expect(updated.forwardUrl).to.equal(keyword.forwardUrl + '-test');
						expect(updated.enabled).to.equal(keyword.enabled);
					})
					// Delete keyword
					.then(() => client.deleteKeyword(keyword.keywordId))
					// Verify deleted keyword
					.then(() => client.getKeyword(keyword.keywordId))
					.then((deleted) => {
						expect(deleted).to.be.null;
					});
			});
		});

		describe('Validation', () => {
			describe('getKeywords()', () => {
				it('mode should be one of Text, Wildcard, Regex', () => {
					return client.getKeywords({ mode: 'Invalid Mode Value' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"mode" must be one of [Text, Wildcard, Regex]']);
						});
				});
			});

			describe('postKeyword()', () => {
				it('keyword should be required', () => {
					return client.postKeyword()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keyword" is required']);
						});
				});

				it('keyword.shortNumberId, keyword.keywordText, keyword.mode, keyword.forwardUrl, keyword.enabled should be required', () => {
					return client.postKeyword({})
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"shortNumberId" is required', '"keywordText" is required', '"mode" is required',
								'"forwardUrl" is required', '"enabled" is required']);
						});
				});

				it('keyword.shortNumberId, keyword.keywordText, keyword.forwardUrl should not be blank', () => {
					return client.postKeyword({ shortNumberId: '', keywordText: '', mode: 'Text', forwardUrl: '' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"shortNumberId" is not allowed to be empty', '"keywordText" is not allowed to be empty',
								'"forwardUrl" is not allowed to be empty', '"enabled" is required']);
						});
				});

				it('keyword.mode should be one of Text, Wildcard, Regex', () => {
					return client.postKeyword({ shortNumberId: 'ShortNumberId', keywordText: 'KeywordText', mode: 'Invalid Mode Value', forwardUrl: 'ForwardUrl', enabled: true })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"mode" must be one of [Text, Wildcard, Regex]']);
						});
				});
			});

			describe('getKeyword()', () => {
				it('keywordId should be required', () => {
					return client.getKeyword()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is required']);
						});
				});

				it('keywordId should not be blank', () => {
					return client.getKeyword('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is not allowed to be empty']);
						});
				});
			});

			describe('putKeyword()', () => {
				it('keyword should be required', () => {
					return client.putKeyword()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keyword" is required']);
						});
				});

				it('keyword.keywordId, keyword.shortNumberId, keyword.keywordText, keyword.mode, keyword.forwardUrl, keyword.enabled should be required', () => {
					return client.putKeyword({})
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is required', '"shortNumberId" is required', '"keywordText" is required',
								'"mode" is required', '"forwardUrl" is required', '"enabled" is required']);
						});
				});

				it('keyword.keywordId, keyword.shortNumberId, keyword.keywordText, keyword.forwardUrl should not be blank', () => {
					return client.putKeyword({ keywordId: '', shortNumberId: '', keywordText: '', mode: 'Regex', forwardUrl: '', enabled: true })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is not allowed to be empty', '"shortNumberId" is not allowed to be empty',
								'"keywordText" is not allowed to be empty', '"forwardUrl" is not allowed to be empty']);
						});
				});

				it('keyword.mode should be one of Text, Wildcard, Regex', () => {
					return client.putKeyword({ keywordId: 'KeywordId', shortNumberId: 'ShortNumberId', keywordText: 'KeywordText', mode: 'Invalid Mode Value', forwardUrl: 'ForwardUrl' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"mode" must be one of [Text, Wildcard, Regex]', '"enabled" is required']);
						});
				});
			});

			describe('deleteKeyword()', () => {
				it('keywordId should be required', () => {
					return client.deleteKeyword()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is required']);
						});
				});

				it('keywordId should not be blank', () => {
					return client.deleteKeyword('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"keywordId" is not allowed to be empty']);
						});
				});
			});
		});
	});

	describe('Lookup', () => {
		describe('Integration', () => {
			it('address should be looked up', () => {
				let msisdn = '+4798079008';

				// Lookup address
				return client.addressLookup(msisdn)
					// Verify lookup result
					.then((lookupResult) => {
						expect(lookupResult).to.exist;
						expect(lookupResult.msisdn).to.equal(msisdn);
						expect(lookupResult.firstName).to.equal('Hans');
						expect(lookupResult.middleName).to.equal('Olav');
						expect(lookupResult.lastName).to.equal('Stjernholm');
						expect(lookupResult.gender).to.equal('M');
						expect(lookupResult.age).to.equal(40);
					});
			});
		});

		describe('Validation', () => {
			describe('addressLookup()', () => {
				it('msisdn should be required', () => {
					return client.addressLookup()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"msisdn" is required']);
						});
				});

				it('msisdn should not be blank', () => {
					return client.addressLookup('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"msisdn" is not allowed to be empty']);
						});
				});
			});
		});
	});

	describe('OutMessage', () => {
		describe('Integration', () => {
			it('out-message should be created, updated and deleted', () => {
				let msisdn = '+4798079008';

				let outMessageForBatch = {
					sender: 'OutMessageBatch Sender',
					recipient: '+4798079008',
					content: 'OutMessageBatch 0001',
					sendTime: moment().add(1, 'days').format(),
					transactionId: uuidv4()
				};

				let outMessage = {
					sender: 'OutMessage Sender',
					recipient: '+4798079008',
					content: 'OutMessage 0001',
					sendTime: moment().add(1, 'days').format()
				};

				// Prepare msisdns
				return client.prepareMsisdns([msisdn])
					// Create out-message batch
					.then(() => client.postOutMessageBatch([outMessageForBatch]))
					.then((transactionIdsBatch) => transactionIdsBatch[0])
					// Read out-message batch
					.then((transactionIdBatch) => client.getOutMessage(transactionIdBatch))
					// Verify created out-message batch
					.then((createdBatch) => {
						expect(createdBatch.sender).to.equal(outMessageForBatch.sender);
						expect(createdBatch.recipient).to.equal(outMessageForBatch.recipient);
						expect(createdBatch.content).to.equal(outMessageForBatch.content);
						expect(createdBatch.transactionId).to.equal(outMessageForBatch.transactionId);
					})
					// Create out-message
					.then(() => client.postOutMessage(outMessage))
					.then((transactionId) => outMessage.transactionId = transactionId)
					// Read out-message
					.then(() => client.getOutMessage(outMessage.transactionId))
					// Verify created out-message
					.then((created) => {
						expect(created.sender).to.equal(outMessage.sender);
						expect(created.recipient).to.equal(outMessage.recipient);
						expect(created.content).to.equal(outMessage.content);
						expect(created.transactionId).to.equal(outMessage.transactionId);
					})
					// Update out-message
					.then(() => client.putOutMessage({ transactionId: outMessage.transactionId, sender: outMessage.sender, recipient: outMessage.recipient,
						content: outMessage.content + '-test', sendTime: outMessage.sendTime }))
					// Read out-message
					.then(() => client.getOutMessage(outMessage.transactionId))
					// Verify updated out-message
					.then((updated) => {
						expect(updated.sender).to.equal(outMessage.sender);
						expect(updated.recipient).to.equal(outMessage.recipient);
						expect(updated.content).to.equal(outMessage.content);
						expect(updated.transactionId).to.equal(outMessage.transactionId);
					})
					// Delete out-message batch
					.then(() => client.deleteOutMessage(outMessageForBatch.transactionId))
					// Verify deleted out-message batch
					.then(() => client.getOutMessage(outMessageForBatch.transactionId))
					.then((deletedBatch) => {
						expect(deletedBatch).to.be.null;
					})
					// Delete out-message batch
					.then(() => client.deleteOutMessage(outMessage.transactionId))
					// Verify deleted out-message batch
					.then(() => client.getOutMessage(outMessage.transactionId))
					.then((deleted) => {
						expect(deleted).to.be.null;
					});
			});
		});

		describe('Validation', () => {
			describe('prepareMsisdns()', () => {
				it('msisdns should be required', () => {
					return client.prepareMsisdns()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"msisdns" is required']);
						});
				});

				it('msisdns should contain at least 1 item', () => {
					return client.prepareMsisdns([])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"msisdns" does not contain 1 required value(s)']);
						});
				});

				it('msisdns item should not be blank', () => {
					return client.prepareMsisdns([''])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"0" is not allowed to be empty', '"msisdns" does not contain 1 required value(s)']);
						});
				});
			});

			describe('postOutMessageBatch()', () => {
				it('outMessages should be required', () => {
					return client.postOutMessageBatch()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"outMessages" is required']);
						});
				});

				it('outMessages should contain at least 1 item', () => {
					return client.postOutMessageBatch([])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"outMessages" does not contain 1 required value(s)']);
						});
				});

				it('outMessages[0].sender, outMessages[0].recipient, outMessages[0].content should be required', () => {
					return client.postOutMessageBatch([{}])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"sender" is required', '"recipient" is required', '"content" is required',
								'"outMessages" does not contain 1 required value(s)']);
						});
				});

				it('outMessages[0].sender, outMessages[0].recipient, outMessages[0].content should not be blank', () => {
					return client.postOutMessageBatch([{ sender: '', recipient: '', content: '' }])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"sender" is not allowed to be empty', '"recipient" is not allowed to be empty', '"content" is not allowed to be empty',
								'"outMessages" does not contain 1 required value(s)']);
						});
				});

				it('outMessages[0].priority should be one of Low, Normal, High', () => {
					return client.postOutMessageBatch([{ sender: 'Sender', recipient: 'Recipient', content: 'Content', priority: 'Invalid priority Value' }])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"priority" must be one of [Low, Normal, High]', '"outMessages" does not contain 1 required value(s)']);
						});
				});

				it('outMessages[0].deliveryMode should be one of AtLeastOnce, AtMostOnce', () => {
					return client.postOutMessageBatch([{ sender: 'Sender', recipient: 'Recipient', content: 'Content', deliveryMode: 'Invalid DeliveryMode Value' }])
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"deliveryMode" must be one of [AtLeastOnce, AtMostOnce]', '"outMessages" does not contain 1 required value(s)']);
						});
				});
			});

			describe('postOutMessage()', () => {
				it('outMessage should be required', () => {
					return client.postOutMessage()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"outMessage" is required']);
						});
				});

				it('outMessage.sender, outMessage.recipient, outMessage.content should be required', () => {
					return client.postOutMessage({})
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"sender" is required', '"recipient" is required', '"content" is required']);
						});
				});

				it('outMessage.sender, outMessage.recipient, outMessage.content should not be blank', () => {
					return client.postOutMessage({ sender: '', recipient: '', content: '' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"sender" is not allowed to be empty', '"recipient" is not allowed to be empty', '"content" is not allowed to be empty']);
						});
				});

				it('outMessages.priority should be one of Low, Normal, High ', () => {
					return client.postOutMessage({ sender: 'Sender', recipient: 'Recipient', content: 'Content', priority: 'Invalid priority Value' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"priority" must be one of [Low, Normal, High]']);
						});
				});

				it('outMessages.deliveryMode should be one of AtLeastOnce, AtMostOnce', () => {
					return client.postOutMessage({ sender: 'Sender', recipient: 'Recipient', content: 'Content', deliveryMode: 'Invalid DeliveryMode Value' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"deliveryMode" must be one of [AtLeastOnce, AtMostOnce]']);
						});
				});
			});

			describe('getOutMessage()', () => {
				it('transactionId should be required', () => {
					return client.getOutMessage()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is required']);
						});
				});

				it('transactionId should not be blank', () => {
					return client.getOutMessage('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is not allowed to be empty']);
						});
				});
			});

			describe('putOutMessage()', () => {
				it('outMessage should be required', () => {
					return client.putOutMessage()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"outMessage" is required']);
						});
				});

				it('outMessage.transactionId, outMessage.sender, outMessage.recipient, outMessage.content should be required', () => {
					return client.putOutMessage({})
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is required', '"sender" is required', '"recipient" is required', '"content" is required']);
						});
				});

				it('outMessage.transactionId, outMessage.sender, outMessage.recipient, outMessage.content should not be blank', () => {
					return client.putOutMessage({ transactionId: '', sender: '', recipient: '', content: '' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is not allowed to be empty', '"sender" is not allowed to be empty', '"recipient" is not allowed to be empty',
								'"content" is not allowed to be empty']);
						});
				});
			});

			describe('deleteOutMessage()', () => {
				it('transactionId should be required', () => {
					return client.deleteOutMessage()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is required']);
						});
				});

				it('transactionId should not be blank', () => {
					return client.deleteOutMessage('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is not allowed to be empty']);
						});
				});
			});
		});
	});

	describe('Strex', () => {
		describe('Integration', () => {
			it('strex merchant should be created, updated and deleted', () => {
				let strexMerchantId = {
					merchantId: '10000001',
					shortNumberId: 'NO-0000',
					password: 'test'
				};

				// Delete strex merchant id if it exists (data cleanup)
				return client.getMerchantIds()
					.then((strexMerchantIds) => strexMerchantIds.map((smid) => smid.merchantId === strexMerchantId.merchantId))
					.then((strexMerchantIds) => Promise.all(strexMerchantIds.map((smid) => client.deleteMerchantId(smid.merchantId))))
					// Create strex merchant id
					.then(() => client.putMerchantId(strexMerchantId))
					// Read strex merchant id
					.then(() => client.getMerchantId(strexMerchantId.merchantId))
					// Verify created strex merchant id
					.then((created) => {
						expect(created.merchantId).to.equal(strexMerchantId.merchantId);
						expect(created.shortNumberId).to.equal(strexMerchantId.shortNumberId);
						expect(created.password).to.be.null;
					})
					// Update strex merchant id
					.then(() => client.putMerchantId({ merchantId: strexMerchantId.merchantId, shortNumberId: strexMerchantId.shortNumberId,
						password: strexMerchantId.password + '-test' }))
					// Read strex merchant id
					.then(() => client.getMerchantId(strexMerchantId.merchantId))
					// Verify updated strex merchant id
					.then((updated) => {
						expect(updated.merchantId).to.equal(strexMerchantId.merchantId);
						expect(updated.shortNumberId).to.equal(strexMerchantId.shortNumberId);
						expect(updated.password).to.be.null;
					})
					// Delete strex merchant id
					.then(() => client.deleteMerchantId(strexMerchantId.merchantId))
					// Verify deleted strex merchant id
					.then(() => client.getMerchantId(strexMerchantId.merchantId))
					.then((deleted) => {
						expect(deleted).to.be.null;
					});
			});	
		});

		describe('Validation', () => {
			describe('getMerchantId()', () => {
				it('merchantId should be required', () => {
					return client.getMerchantId()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is required']);
						});
				});

				it('merchantId should not be blank', () => {
					return client.getMerchantId('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is not allowed to be empty']);
						});
				});
			});

			describe('putMerchantId()', () => {
				it('strexMerchantId should be required', () => {
					return client.putMerchantId()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"strexMerchantId" is required']);
						});
				});

				it('strexMerchantId.merchantId, strexMerchantId.shortNumberId should be required', () => {
					return client.putMerchantId({})
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is required', '"shortNumberId" is required']);
						});
				});

				it('strexMerchantId.merchantId, strexMerchantId.shortNumberId should not be blank', () => {
					return client.putMerchantId({ merchantId: '', shortNumberId: '' })
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is not allowed to be empty', '"shortNumberId" is not allowed to be empty']);
						});
				});
			});

			describe('deleteMerchantId()', () => {
				it('merchantId should be required', () => {
					return client.deleteMerchantId()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is required']);
						});
				});

				it('merchantId should not be blank', () => {
					return client.deleteMerchantId('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"merchantId" is not allowed to be empty']);
						});
				});
			});
		});
	});

	describe('[TODO] Verification', () => {
		describe('Integration', () => {
			it('signature is verified', () => {
				// TODO Add test
				// Need to have a message encrypted with a private key, which could be verified by a server public key
			});
		});

		describe('Validation', () => {
			describe('verifySignature()', () => {
				it('method, uri, xEcdsaSignatureString should be required', () => {
					return client.verifySignature()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"method" is required', '"uri" is required', '"xEcdsaSignatureString" is required']);
						});
				});

				it('method, uri, xEcdsaSignatureString should not be blank', () => {
					return client.verifySignature('', '', '', '')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"method" is not allowed to be empty', '"uri" is not allowed to be empty', '"xEcdsaSignatureString" is not allowed to be empty',
								'"xEcdsaSignatureString" with value "" fails to match the required pattern: /^[A-Za-z0-9_-]+:[0-9]+:[A-Za-z0-9_-]+:[A-Za-z0-9_+\\/=]+$/']);
						});
				});

				it('xEcdsaSignatureString should match the pattern', () => {
					return client.verifySignature('GET', 'uri', '', ':::')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"xEcdsaSignatureString" with value ":::" fails to match the required pattern: /^[A-Za-z0-9_-]+:[0-9]+:[A-Za-z0-9_-]+:[A-Za-z0-9_+\\/=]+$/']);
						});
				});

				it('timestamp clock-drift should be less than 5 minutes', () => {
					const sign = client.getSigner().signHeader('TestKey', 'GET', 'http://test.com', '');
					// Replace a timestamp with the one in the past
					const parts = sign.replace('HMAC ', '').split(':');
					const clockDriftedSign = parts[0] + ':' + moment().subtract(1, 'days').unix() + ':' + parts[2] + ':' + parts[3];

					return client.verifySignature('GET', 'uri', '', clockDriftedSign)
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"timestamp" must be greater than ' + moment().subtract(5, 'minutes').unix()]);
						});
				});
			});
		});
	});

	describe('[TODO] Reverse', () => {
		describe('Integration', () => {
			it('payment is reversed', () => {
				// TODO Add test 
				// Message reverse fail with message {"Message":"transaction id 'be1a1806-960a-45cc-98a2-fad6c8d7c2d8'hasn't been billed/processed and can't be reversed."}
			});
		});

		describe('Validation', () => {
			describe('reversePayment()', () => {
				it('transactionId should be required', () => {
					return client.reversePayment()
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is required']);
						});
				});

				it('transactionId should not be blank', () => {
					return client.reversePayment('')
						.then((response) => {
							expect(response.error).to.equal('InvalidInput');
							expect(response.constraints).to.deep.equal(['"transactionId" is not allowed to be empty']);
						});
				});
			});
		});
	});
});
