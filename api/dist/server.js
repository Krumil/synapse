"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = __importDefault(require("./routes/index"));
const dotenv_1 = __importDefault(require("dotenv"));
const fetchTokens_1 = require("./fetchTokens");
const fetchYields_1 = require("./fetchYields");
dotenv_1.default.config();
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware and routes
app.use(express_1.default.json());
app.use('/api', index_1.default);
// Initial fetch
(0, fetchTokens_1.fetchTokens)();
(0, fetchYields_1.fetchYields)();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Export the app as a serverless function
module.exports = app;
