'use strict';

/*
* Merchant configuration properties are taken from Configuration module
*/

// Load environment variables from .env file if present
require('dotenv').config();

// common parameters
const AuthenticationType = process.env.VISA_ACCEPTANCE_AUTH_TYPE || 'http_signature';
const RunEnvironment = 'apitest.cybersource.com';
const MerchantId = process.env.VISA_ACCEPTANCE_MERCHANT_ID;

// http_signature parameters
const MerchantKeyId = process.env.VISA_ACCEPTANCE_API_KEY_ID;
const MerchantSecretKey = process.env.VISA_ACCEPTANCE_SECRET_KEY;

// jwt parameters
const KeysDirectory = 'Resource';
const KeyFileName = process.env.VISA_ACCEPTANCE_KEY_FILENAME || 'testrest';
const KeyAlias = process.env.VISA_ACCEPTANCE_KEY_ALIAS || 'testrest';
const KeyPass = process.env.VISA_ACCEPTANCE_KEY_PASSWORD || 'testrest';

//meta key parameters
const UseMetaKey = false;
const PortfolioID = '';

// logging parameters
const EnableLog = process.env.ENABLE_LOGGING || 'false';
const LogFileName = process.env.LOG_FILENAME || 'visa_acceptance';
const LogDirectory = './log';
const LogfileMaxSize = process.env.LOG_FILE_MAX_SIZE || '5242880'; //10 MB In Bytes
const EnableMasking = true;

/*
PEM Key file path for decoding JWE Response Enter the folder path where the .pem file is located.
It is optional property, require adding only during JWE decryption.
*/
const PemFileDirectory = 'Resource/NetworkTokenCert.pem';

//Add the property if required to override the cybs default developerId in all request body
const DefaultDeveloperId = '';

// Constructor for Configuration
function Configuration() {

    var configObj = {
        'authenticationType': AuthenticationType,
        'runEnvironment': RunEnvironment,

        'merchantID': MerchantId,
        'merchantKeyId': MerchantKeyId,
        'merchantsecretKey': MerchantSecretKey,

        'keyAlias': KeyAlias,
        'keyPass': KeyPass,
        'keyFileName': KeyFileName,
        'keysDirectory': KeysDirectory,

        'useMetaKey': UseMetaKey,
        'portfolioID': PortfolioID,
        'pemFileDirectory': PemFileDirectory,
        'defaultDeveloperId': DefaultDeveloperId,
        'logConfiguration': {
            'enableLog': EnableLog,
            'logFileName': LogFileName,
            'logDirectory': LogDirectory,
            'logFileMaxSize': LogfileMaxSize,
            'loggingLevel': 'debug',
            'enableMasking': EnableMasking
        }
    };
    return configObj;

}

module.exports = Configuration;
