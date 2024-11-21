"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertAmountToSmallestUnit = convertAmountToSmallestUnit;
exports.splitUint256 = splitUint256;
exports.hexToDecimalString = hexToDecimalString;
exports.replacePlaceholders = replacePlaceholders;
exports.getDeadline = getDeadline;
exports.parseUnderlyingTokens = parseUnderlyingTokens;
exports.reconstructUint256 = reconstructUint256;
exports.getTokensFromS3 = getTokensFromS3;
exports.getYieldsFromS3 = getYieldsFromS3;
const client_s3_1 = require("@aws-sdk/client-s3");
function convertAmountToSmallestUnit(amount, decimals) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
        throw new Error(`Invalid amount: ${amount}`);
    }
    const factor = 10 ** decimals;
    return (amountNum * factor).toFixed(0);
}
function splitUint256(amount) {
    const amountBigInt = BigInt(amount);
    const maxUint128 = BigInt("0x100000000000000000000000000000000");
    return {
        low: (amountBigInt % maxUint128).toString(),
        high: (amountBigInt / maxUint128).toString()
    };
}
function hexToDecimalString(hex) {
    return hex.startsWith("0x") ? BigInt(hex).toString(10) : hex;
}
function replacePlaceholders(str, params) {
    return str.replace(/\{([^}]+)\}/g, (match, p1) => {
        const value = params[p1];
        if (value === undefined) {
            throw new Error(`Missing parameter "${p1}" for transaction generation.`);
        }
        return value;
    });
}
function getDeadline(bufferMinutes = 15) {
    return (Math.floor(Date.now() / 1000) + bufferMinutes * 60).toString();
}
function parseUnderlyingTokens(pairKey) {
    return pairKey.split('/');
}
function reconstructUint256(low, high) {
    const lowBigInt = BigInt(low);
    const highBigInt = BigInt(high);
    return (highBigInt << BigInt(128)) + lowBigInt;
}
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.AWS_ENDPOINT
});
async function getTokensFromS3() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined');
    }
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'tokens.json'
        });
        const response = await s3Client.send(command);
        const tokensData = JSON.parse(await response.Body?.transformToString() || '[]');
        return tokensData;
    }
    catch (error) {
        console.error('Error fetching tokens from S3:', error);
        return [];
    }
}
async function getYieldsFromS3() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined');
    }
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'yields.json'
        });
        const response = await s3Client.send(command);
        const yieldsData = JSON.parse(await response.Body?.transformToString() || '[]');
        return yieldsData;
    }
    catch (error) {
        console.error('Error fetching yields from S3:', error);
        return [];
    }
}
