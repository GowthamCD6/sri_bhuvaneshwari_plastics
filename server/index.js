const express = require('express');
const bodyparser=require('body-parser');
const cors= require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app=express();
require('dotenv').config();
const db=require('./config/db');
const port=process.env.PORT;

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
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
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

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});