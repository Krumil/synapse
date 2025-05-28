import express from "express";
import routes from "./routes/index";
import dotenv from "dotenv";
import { fetchTokens } from "./fetchTokens";
import { fetchYields } from "./fetchYields";
import { startPriceUpdateScheduler } from "./agent/utils/defiUtils";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware and routes
app.use(express.json());
app.use("/api", routes);

// Initial fetch
fetchTokens();
fetchYields();

// Start price update scheduler (every 1 minute by default)
if (process.env.NODE_ENV !== "test") {
    startPriceUpdateScheduler(20);
    console.log("Price update scheduler initialized");
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the app as a serverless function
module.exports = app;
