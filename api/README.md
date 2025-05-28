# Synapse API

## Price Caching System

The API now includes an automated price caching system that saves token prices to S3 and updates them regularly.

### Features

-   **Automatic Updates**: Prices are fetched and saved to S3 every minute by default
-   **Fallback System**: If API calls fail, cached prices from S3 are used as fallback
-   **Historical Data**: All price updates are saved with timestamps for historical analysis
-   **Manual Control**: API endpoints to manually trigger updates and control the scheduler

### S3 Structure

```
prices/
├── latest.json              # Most recent prices
└── history/
    ├── 2024-01-01-12-00.json # Historical prices by minute
    ├── 2024-01-01-12-01.json
    └── ...
```

### API Endpoints

#### Price Management

-   `POST /api/prices/update` - Manually trigger a price update
-   `GET /api/prices/latest` - Get the latest cached prices from S3
-   `GET /api/prices/history` - Get historical price data from S3
    -   Query params: `startDate`, `endDate`, `limit` (optional)
-   `POST /api/prices/scheduler/start` - Start the automatic price update scheduler
    -   Body: `{ "intervalMinutes": 1 }` (optional, defaults to 1 minute)
-   `POST /api/prices/scheduler/stop` - Stop the automatic price update scheduler

#### Example Usage

```bash
# Get latest prices
curl http://localhost:3001/api/prices/latest

# Get price history (last 100 entries)
curl http://localhost:3001/api/prices/history

# Get price history with date filtering
curl "http://localhost:3001/api/prices/history?startDate=2024-01-01&endDate=2024-01-02&limit=50"

# Manually update prices
curl -X POST http://localhost:3001/api/prices/update

# Start scheduler with 5-minute intervals
curl -X POST http://localhost:3001/api/prices/scheduler/start \
  -H "Content-Type: application/json" \
  -d '{"intervalMinutes": 5}'

# Stop scheduler
curl -X POST http://localhost:3001/api/prices/scheduler/stop
```

### Environment Variables

Make sure these S3 environment variables are configured:

-   `S3_BUCKET_NAME` - S3 bucket name for storing data
-   `AWS_ACCESS_KEY_ID` - AWS access key
-   `AWS_SECRET_ACCESS_KEY` - AWS secret key
-   `AWS_REGION` - AWS region
-   `AWS_ENDPOINT` - AWS endpoint (optional)

### Price Data Format

```json
{
    "timestamp": "2024-01-01T12:00:00.000Z",
    "prices": {
        "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7": 1.23,
        "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8": 4.56
    }
}
```

### Automatic Initialization

The price update scheduler starts automatically when the server starts (except in test environment). It will:

1. Fetch prices for all tokens and DeFi tokens
2. Save them to S3 in both `latest.json` and historical files
3. Repeat every minute
4. Use cached prices as fallback if API calls fail
