const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");

router.post("/add", async (req,res)=>{
    const budget = new Budget(req.body);
    await budget.save();
    res.json(budget);
});

router.get("/", async(req,res)=>{
    const budgets = await Budget.find();
    res.json(budgets);
});

module.exports = router;
