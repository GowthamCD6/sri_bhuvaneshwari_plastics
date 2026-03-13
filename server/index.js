const express = require('express');
const bodyparser=require('body-parser');
const cors= require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app=express();
require('dotenv').config();
const db=require('./config/db');
const port=process.env.PORT || 5000;

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const purchaseIndentRoutes = require('./routes/purchaseIndentRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const stockAdjustmentRoutes = require('./routes/stockAdjustmentRoutes');
const storeRequestRoutes = require('./routes/storeRequestRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Middleware
const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser tools (no Origin header)
        if (!origin) return callback(null, true);

        // Dev-friendly: allow any localhost port (Vite may pick 5174, 5175, ...)
        if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);

        const allowed = process.env.CLIENT_URL || 'http://localhost:5173';
        if (origin === allowed) return callback(null, true);

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// Important: handle preflight requests before auth middleware routes
app.options(/.*/, cors(corsOptions));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
app.use(cookieParser());

// Serve uploaded files statically with proper error handling
app.use('/uploads', (req, res, next) => {
    // Decode URL-encoded characters in the path
    req.url = decodeURIComponent(req.url);
    next();
}, express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    maxAge: '1h',
    etag: false
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/customer-orders', customerOrderRoutes);
app.use('/api/purchase-indents', purchaseIndentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock-adjustments', stockAdjustmentRoutes);
app.use('/api/store-requests', storeRequestRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Auto-run DB migrations on startup
async function runMigrations() {
    const migrations = [
        // Add reason column if not present
        `ALTER TABLE purchase_indents ADD COLUMN IF NOT EXISTS reason TEXT AFTER priority`,
        // Extend priority ENUM to include Normal
        `ALTER TABLE purchase_indents MODIFY COLUMN priority ENUM('Normal','Standard','High','Urgent') DEFAULT 'Normal'`,
        // Extend workflow_stage ENUM to include Purchase Dept
        `ALTER TABLE purchase_indents MODIFY COLUMN workflow_stage ENUM('Purchase Dept','QMS Init','Store Officer','QMS Verified','Admin','Accountant','Completed') DEFAULT 'QMS Init'`,
        // Ensure full status ENUM
        `ALTER TABLE purchase_indents MODIFY COLUMN status ENUM('Draft','Pending Store Review','Store Verified','Pending QMS Verification','QMS Verified','Pending Admin Approval','Admin Approved','Rejected') DEFAULT 'Draft'`,
    ];
    for (const sql of migrations) {
        try {
            await db.query(sql);
        } catch (err) {
            console.warn('Migration warning:', err.message);
        }
    }
    console.log('DB migrations applied.');
}

app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await runMigrations();
});