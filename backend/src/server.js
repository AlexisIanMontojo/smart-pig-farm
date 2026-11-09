
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/database');

const pigsRoutes = require('./routes/pigs.routes');
const pensRoutes = require('./routes/pens.routes');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
}));

app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        message: 'Smart Pig Farm API is running.',
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT NOW() AS databaseTime'
        );

        res.json({
            success: true,
            message: 'Backend connected to MySQL successfully.',
            databaseTime: rows[0].databaseTime,
        });
    } catch (error) {
        console.error('Database connection failed:', error.message);

        res.status(500).json({
            success: false,
            message: 'Database connection failed.',
        });
    }
});

app.use('/api/pigs', pigsRoutes);
app.use('/api/pens', pensRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Smart Pig Farm API running on http://localhost:${PORT}`);
});
