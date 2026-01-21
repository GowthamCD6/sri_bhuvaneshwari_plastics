const express = require('express');
const bodyparser=require('body-parser');
const cors= require('cors');
const app=express();
require('dotenv').config();
const db=require('./config/db');
const port=process.env.PORT;

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));




app.listen(port,()=>{
    console.log(`Server running on port ${port}`);
});