import express from "express";
import routes from "./routes/index";
import dotenv from "dotenv";
import { fetchTokens } from "./fetchTokens";
import { fetchYields } from "./fetchYields";

dotenv.config();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware and routes
app.use(express.json());
app.use("/api", routes);

// Initial fetch
fetchTokens();
fetchYields();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export the app as a serverless function
module.exports = app;
