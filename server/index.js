const express = require('express');
const bodyparser=require('body-parser');
const cors= require('cors');
const cookieParser = require('cookie-parser');
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

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));
app.use(cookieParser());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/customer-orders', customerOrderRoutes);
app.use('/api/purchase-indents', purchaseIndentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});