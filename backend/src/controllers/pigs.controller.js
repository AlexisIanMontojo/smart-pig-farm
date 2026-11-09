const pool = require('../config/database');

function formatPig(row) {
    return {
        id: `PG-${String(row.id).padStart(3, '0')}`,
        tagNo: row.tag_number,
        label: row.label || '',
        breed: row.breed,
        sex: row.sex,
        birthDate: row.birth_date,
        penId: row.pen_code,
        currentWeightKg: Number(row.current_weight_kg),
        healthStatus: row.health_status,
        reproductiveStatus: row.reproductive_status,
        stage: row.stage,
        dateAdded: row.date_added,
        archived: Boolean(row.archived),
        notes: row.notes || '',
    };
}

function getDatabaseId(id) {
    const match = String(id).match(/^PG-(\d+)$/);
    return match ? Number(match[1]) : null;
}

const pigQuery = `
    SELECT
        p.*,
        pen.pen_code
    FROM pigs p
    LEFT JOIN pens pen ON p.pen_id = pen.id
`;

exports.getAllPigs = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `${pigQuery} ORDER BY p.id DESC`
        );

        res.json({
            success: true,
            data: rows.map(formatPig),
        });
    } catch (error) {
        console.error('Get pigs error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pig records.',
        });
    }
};

exports.getPigById = async (req, res) => {
    try {
        const id = getDatabaseId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pig ID.',
            });
        }

        const [rows] = await pool.query(
            `${pigQuery} WHERE p.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pig record not found.',
            });
        }

        res.json({
            success: true,
            data: formatPig(rows[0]),
        });
    } catch (error) {
        console.error('Get pig error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve pig record.',
        });
    }
};

exports.createPig = async (req, res) => {
    try {
        const {
            tagNo,
            label,
            breed,
            sex,
            birthDate,
            penId,
            currentWeightKg,
            healthStatus,
            reproductiveStatus,
            stage,
            notes,
        } = req.body;

        if (
            !tagNo || !breed || !sex || !birthDate ||
            !penId || currentWeightKg === undefined || !stage
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required pig information.',
            });
        }

        const weight = Number(currentWeightKg);

        if (!Number.isFinite(weight) || weight < 0.5 || weight > 500) {
            return res.status(400).json({
                success: false,
                message: 'Weight must be between 0.5 and 500 kg.',
            });
        }

        const [pens] = await pool.query(
            'SELECT id FROM pens WHERE pen_code = ?',
            [penId]
        );

        if (pens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected pen does not exist.',
            });
        }

        const [result] = await pool.query(
            `INSERT INTO pigs (
                tag_number, label, breed, sex, birth_date,
                pen_id, current_weight_kg, health_status,
                reproductive_status, stage, date_added, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
            [
                tagNo,
                label || null,
                breed,
                sex,
                birthDate,
                pens[0].id,
                weight,
                healthStatus || 'Healthy',
                reproductiveStatus || 'Not Applicable',
                stage,
                notes || null,
            ]
        );

        const [created] = await pool.query(
            `${pigQuery} WHERE p.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Pig registered successfully.',
            data: formatPig(created[0]),
        });
    } catch (error) {
        console.error('Create pig error:', error.message);

        res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
            success: false,
            message: error.code === 'ER_DUP_ENTRY'
                ? 'That tag number already exists.'
                : 'Failed to register pig.',
        });
    }
};

exports.updatePig = async (req, res) => {
    try {
        const id = getDatabaseId(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pig ID.',
            });
        }

        const {
            tagNo,
            label,
            breed,
            sex,
            birthDate,
            penId,
            currentWeightKg,
            healthStatus,
            reproductiveStatus,
            stage,
            notes,
        } = req.body;

        const [pens] = await pool.query(
            'SELECT id FROM pens WHERE pen_code = ?',
            [penId]
        );

        if (pens.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected pen does not exist.',
            });
        }

        const weight = Number(currentWeightKg);

        if (!Number.isFinite(weight) || weight < 0.5 || weight > 500) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pig weight.',
            });
        }

        const [result] = await pool.query(
            `UPDATE pigs SET
                tag_number = ?,
                label = ?,
                breed = ?,
                sex = ?,
                birth_date = ?,
                pen_id = ?,
                current_weight_kg = ?,
                health_status = ?,
                reproductive_status = ?,
                stage = ?,
                notes = ?
            WHERE id = ?`,
            [
                tagNo,
                label || null,
                breed,
                sex,
                birthDate,
                pens[0].id,
                weight,
                healthStatus || 'Healthy',
                reproductiveStatus || 'Not Applicable',
                stage,
                notes || null,
                id,
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                'SELECT id FROM pigs WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pig record not found.',
                });
            }
        }

        const [updated] = await pool.query(
            `${pigQuery} WHERE p.id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: 'Pig record updated successfully.',
            data: formatPig(updated[0]),
        });
    } catch (error) {
        console.error('Update pig error:', error.message);

        res.status(error.code === 'ER_DUP_ENTRY' ? 409 : 500).json({
            success: false,
            message: error.code === 'ER_DUP_ENTRY'
                ? 'That tag number already exists.'
                : 'Failed to update pig record.',
        });
    }
};

exports.archivePig = async (req, res) => {
    try {
        const id = getDatabaseId(req.params.id);
        const archived = req.body.archived;

        if (!id || typeof archived !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Provide a valid pig ID and archived boolean.',
            });
        }

        const [result] = await pool.query(
            'UPDATE pigs SET archived = ? WHERE id = ?',
            [archived, id]
        );

        if (result.affectedRows === 0) {
            const [existing] = await pool.query(
                'SELECT id FROM pigs WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Pig record not found.',
                });
            }
        }

        res.json({
            success: true,
            message: archived ? 'Pig archived.' : 'Pig restored.',
        });
    } catch (error) {
        console.error('Archive pig error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update archive status.',
        });
    }
};
