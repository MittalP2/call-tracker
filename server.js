const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : '.';
if (!fs.existsSync(dataDir) && dataDir !== '.') {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize SQLite database
const db = new sqlite3.Database('./call-tracker.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initDatabase();
    }
});

// Create tables
function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS call_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            developer_name TEXT NOT NULL,
            client_name TEXT NOT NULL,
            call_date TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            topic_discussed TEXT NOT NULL,
            ticket_number TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// API Routes

// Get all records
app.get('/api/records', (req, res) => {
    const { client, developer, month } = req.query;
    let query = 'SELECT * FROM call_records WHERE 1=1';
    const params = [];

    if (client) {
        query += ' AND client_name = ?';
        params.push(client);
    }

    if (developer) {
        query += ' AND developer_name = ?';
        params.push(developer);
    }

    if (month) {
        query += ' AND strftime("%Y-%m", call_date) = ?';
        params.push(month);
    }

    query += ' ORDER BY call_date DESC, id DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// Add new record
app.post('/api/records', (req, res) => {
    const { developer_name, client_name, call_date, duration_minutes, topic_discussed, ticket_number } = req.body;

    if (!developer_name || !client_name || !call_date || !duration_minutes || !topic_discussed) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
        INSERT INTO call_records (developer_name, client_name, call_date, duration_minutes, topic_discussed, ticket_number)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [developer_name, client_name, call_date, duration_minutes, topic_discussed, ticket_number || null], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ id: this.lastID, message: 'Record added successfully' });
        }
    });
});

// Delete record
app.delete('/api/records/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM call_records WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Record deleted successfully', changes: this.changes });
        }
    });
});

// Get statistics
app.get('/api/stats', (req, res) => {
    const { client, developer, month } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (client) {
        whereClause += ' AND client_name = ?';
        params.push(client);
    }

    if (developer) {
        whereClause += ' AND developer_name = ?';
        params.push(developer);
    }

    if (month) {
        whereClause += ' AND strftime("%Y-%m", call_date) = ?';
        params.push(month);
    }

    const query = `
        SELECT 
            COUNT(*) as total_calls,
            SUM(duration_minutes) as total_minutes,
            COUNT(DISTINCT client_name) as unique_clients,
            COUNT(DISTINCT developer_name) as unique_developers
        FROM call_records
        ${whereClause}
    `;

    db.get(query, params, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({
                ...row,
                total_hours: (row.total_minutes / 60).toFixed(1)
            });
        }
    });
});

// Get unique clients
app.get('/api/clients', (req, res) => {
    db.all('SELECT DISTINCT client_name FROM call_records ORDER BY client_name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(r => r.client_name));
        }
    });
});

// Get unique developers
app.get('/api/developers', (req, res) => {
    db.all('SELECT DISTINCT developer_name FROM call_records ORDER BY developer_name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(r => r.developer_name));
        }
    });
});

// Export to CSV
app.get('/api/export/csv', (req, res) => {
    db.all('SELECT * FROM call_records ORDER BY call_date DESC', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            const headers = ['ID', 'Date', 'Developer', 'Client', 'Duration (min)', 'Topic', 'Ticket'];
            const csvRows = rows.map(r => [
                r.id,
                r.call_date,
                r.developer_name,
                r.client_name,
                r.duration_minutes,
                `"${r.topic_discussed.replace(/"/g, '""')}"`,
                r.ticket_number || ''
            ].join(','));

            const csv = [headers.join(','), ...csvRows].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=call-records.csv');
            res.send(csv);
        }
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Access the tracker at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

