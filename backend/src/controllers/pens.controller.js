
const pool = require('../config/database');

exports.getAllPens = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                pen_code,
                name,
                capacity,
                purpose,
                status,
                sensor_id
            FROM pens
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            data: rows.map((pen) => ({
                id: pen.pen_code,
                name: pen.name,
                capacity: pen.capacity,
                purpose: pen.purpose,
                status: pen.status,
                sensorId: pen.sensor_id,
            })),
        });
    } catch (error) {
        console.error('Get pens error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pens.',
        });
    }
};
