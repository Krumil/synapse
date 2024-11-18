import express from 'express';
import routes from './routes/index';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware and routes
app.use(express.json());
app.use('/api', routes);

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

// Export the app as a serverless function
module.exports = app;
