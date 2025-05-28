import { Router } from "express";
import { chatAgentHandler } from "../agent/agentController";
import { fetchYields } from "../fetchYields";
import { fetchTokens } from "../fetchTokens";
import {
    updateAndSavePrices,
    startPriceUpdateScheduler,
    stopPriceUpdateScheduler,
    getLatestPricesFromS3,
    getPriceHistoryFromS3,
} from "../agent/utils/defiUtils";

const router = Router();

router.post("/chat", chatAgentHandler);

router.get("/trigger-data-fetch", async (req, res) => {
    try {
        await fetchYields();
        await fetchTokens();
        res.json({ status: "success" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Price management endpoints
router.post("/prices/update", async (req, res) => {
    try {
        await updateAndSavePrices();
        res.json({ status: "success", message: "Prices updated successfully" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.post("/prices/scheduler/start", async (req, res) => {
    try {
        const intervalMinutes = parseInt(req.body.intervalMinutes) || 1;
        startPriceUpdateScheduler(intervalMinutes);
        res.json({
            status: "success",
            message: `Price update scheduler started with ${intervalMinutes} minute interval`,
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.post("/prices/scheduler/stop", async (req, res) => {
    try {
        stopPriceUpdateScheduler();
        res.json({ status: "success", message: "Price update scheduler stopped" });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get("/prices/latest", async (req, res) => {
    try {
        const prices = await getLatestPricesFromS3();
        const pricesObject = Object.fromEntries(prices);
        res.json({
            status: "success",
            data: {
                count: prices.size,
                prices: pricesObject,
            },
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get("/prices/history", async (req, res) => {
    try {
        const { startDate, endDate, limit } = req.query;
        const history = await getPriceHistoryFromS3(
            startDate as string,
            endDate as string,
            limit ? parseInt(limit as string) : undefined
        );
        res.json({
            status: "success",
            data: {
                count: history.length,
                history,
            },
        });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

router.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

export default router;
