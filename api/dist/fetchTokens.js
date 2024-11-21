"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTokens = fetchTokens;
const client_s3_1 = require("@aws-sdk/client-s3");
const axios_1 = __importDefault(require("axios"));
// Configure S3 Client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.AWS_ENDPOINT
});
// Function to save tokens to S3
async function fetchTokens() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined');
    }
    try {
        const response = await axios_1.default.get('https://starknet.api.avnu.fi/v1/starknet/tokens');
        const tokens = response.data.content;
        const formattedTokens = tokens
            .filter((token) => token.lastDailyVolumeUsd >= 100)
            .map((token) => ({
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals || 18,
            l2_token_address: token.address,
            tags: token.tags || [],
            logoUri: token.logoUri,
            lastDailyVolumeUsd: token.lastDailyVolumeUsd
        }));
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: 'tokens.json',
            Body: JSON.stringify(formattedTokens, null, 4),
            ContentType: 'application/json'
        });
        await s3Client.send(command);
        console.log('Tokens updated successfully in S3');
    }
    catch (error) {
        console.error('Error updating tokens:', error);
    }
}
