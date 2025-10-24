# Call Tracker - Server Version

A full-stack time tracking application with Node.js/Express backend and SQLite database for true team collaboration.

## Features

✅ **Shared Database** - All team members see the same data in real-time  
✅ **REST API** - Clean API for programmatic access  
✅ **SQLite Database** - Persistent storage, no complex setup  
✅ **Auto-refresh** - Data updates automatically  
✅ **CSV Export** - Download all records  
✅ **Advanced Filtering** - By client, developer, or month  

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

### 3. Access the Application

Open your browser to: **http://localhost:3000**

## Deployment Options

### Option 1: Internal Server
Host on your company's internal server - ideal for teams

### Option 2: Cloud Platform

**Heroku:**
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`

**DigitalOcean/AWS:**
1. Set up a small VM
2. Install Node.js
3. Clone repository
4. Run `npm install && npm start`
5. Use PM2 for process management

**Render/Railway (Easy):**
1. Connect GitHub repo
2. Auto-deploys on push
3. Free tier available

## API Endpoints

### Records
- `GET /api/records` - Get all records (supports query params: client, developer, month)
- `POST /api/records` - Add new record
- `DELETE /api/records/:id` - Delete record

### Metadata
- `GET /api/clients` - Get list of unique clients
- `GET /api/developers` - Get list of unique developers
- `GET /api/stats` - Get statistics (supports same filters as records)

### Export
- `GET /api/export/csv` - Download CSV export

## API Usage Examples

### Add a Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "developer_name": "John Doe",
    "client_name": "SETF",
    "call_date": "2024-10-24",
    "duration_minutes": 45,
    "topic_discussed": "Discussed bug in payment module",
    "ticket_number": "AS-1234"
  }'
```

### Get Filtered Records
```bash
# By client
curl "http://localhost:3000/api/records?client=SETF"

# By developer and month
curl "http://localhost:3000/api/records?developer=John%20Doe&month=2024-10"
```

### Get Statistics
```bash
# Overall stats
curl "http://localhost:3000/api/stats"

# Developer's monthly stats
curl "http://localhost:3000/api/stats?developer=John%20Doe&month=2024-10"
```

## Database

SQLite database is stored in `call-tracker.db` in the root directory.

### Backup
```bash
# Simple file copy
cp call-tracker.db call-tracker-backup.db

# Or export to SQL
sqlite3 call-tracker.db .dump > backup.sql
```

### Restore
```bash
cp call-tracker-backup.db call-tracker.db
```

## Environment Variables

Create a `.env` file (optional):

```env
PORT=3000
NODE_ENV=production
```

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name call-tracker

# View logs
pm2 logs call-tracker

# Restart
pm2 restart call-tracker

# Auto-start on reboot
pm2 startup
pm2 save
```

### Using systemd (Linux)

Create `/etc/systemd/system/call-tracker.service`:

```ini
[Unit]
Description=Call Tracker Application
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/call-tracker/server-version
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable call-tracker
sudo systemctl start call-tracker
```

## Security Considerations

For production:
1. Add authentication (JWT, OAuth, or basic auth)
2. Use HTTPS (reverse proxy with nginx/Apache)
3. Set up CORS properly for your domain
4. Add rate limiting
5. Regular database backups
6. Use environment variables for sensitive config

## Advantages over Standalone Version

✅ **True Team Collaboration** - Everyone sees same data  
✅ **No Import/Export** - Changes sync automatically  
✅ **Centralized** - Single source of truth  
✅ **Scalable** - Can handle many users  
✅ **API Access** - Integrate with other tools  

## Troubleshooting

**Port already in use:**
```bash
# Change port
PORT=3001 npm start
```

**Database locked:**
- Only one process can write at a time
- Restart the server
- Check for zombie processes

**Module not found:**
```bash
rm -rf node_modules
npm install
```

## Maintenance

### View Database
```bash
sqlite3 call-tracker.db
sqlite> .tables
sqlite> SELECT * FROM call_records LIMIT 10;
sqlite> .quit
```

### Clear Old Records
```bash
sqlite3 call-tracker.db
sqlite> DELETE FROM call_records WHERE call_date < '2024-01-01';
```

## Support

For issues or questions, contact your development team lead.

