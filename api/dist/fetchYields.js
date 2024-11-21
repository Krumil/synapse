"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchYields = fetchYields;
const client_s3_1 = require("@aws-sdk/client-s3");
const axios_1 = __importDefault(require("axios"));
const YIELDS_API_URL = 'https://yields.llama.fi/pools';
// Configure S3 Client
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: process.env.AWS_ENDPOINT
});
async function fetchYields() {
    if (!process.env.S3_BUCKET_NAME) {
        throw new Error('S3_BUCKET_NAME is not defined');
    }
    try {
        console.log('Fetching yields data...');
        const response = await axios_1.default.get(YIELDS_API_URL);
        const chainData = {};
        response.data.data.forEach((protocol) => {
            const chain = protocol.chain.toLowerCase();
            if (!chainData[chain]) {
                chainData[chain] = [];
            }
            chainData[chain].push(protocol);
        });
        for (const [chain, protocols] of Object.entries(chainData)) {
            const data = {
                timestamp: new Date().toISOString(),
                chain,
                protocols,
                count: protocols.length,
            };
            const command = new client_s3_1.PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `yields/${chain}.json`,
                Body: JSON.stringify(data, null, '\t'),
                ContentType: 'application/json'
            });
            await s3Client.send(command);
            console.log(`${chain} data saved to S3: yields/${chain}.json`);
        }
    }
    catch (error) {
        console.error('Error fetching yields data:', error);
    }
}
