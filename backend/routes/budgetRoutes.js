const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const ApprovalAuthority = require("../models/ApprovalAuthority");

router.post("/add", async (req, res) => {
    try {
        const { title, financialYear, state, department, allocatedAmount, allocationDate, description, source } = req.body;
        if (!financialYear || !department || !Number.isFinite(Number(allocatedAmount)) || Number(allocatedAmount) < 0) {
            return res.status(400).json({ message: "financialYear, department, and a non-negative allocatedAmount are required" });
        }

        const budget = await Budget.create({
            title,
            financialYear,
            state: state || 'All India',
            department,
            allocatedAmount: Number(allocatedAmount),
            allocationDate: allocationDate || new Date(),
            description,
            source
        });
        res.status(201).json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const filter = req.query.state ? { state: req.query.state } : {};
        const budgets = await Budget.find(filter).sort({ allocationDate: -1 });
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        const { status, authorityId } = req.body;
        if (!["Pending Approval", "Approved", "Rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid budget status" });
        }
        if (!authorityId) return res.status(400).json({ message: "Approved or rejected actions require an authority ID" });
        const authority = await ApprovalAuthority.findOne({ authorityId: authorityId.toUpperCase(), active: true });
        if (!authority) return res.status(403).json({ message: "Only registered CM, DCM, MLA, PM, or MP authorities can act" });
        const budget = await Budget.findByIdAndUpdate(req.params.id, {
            status,
            approval: {
                authorityId: authority.authorityId,
                authorityName: authority.name,
                authorityRole: authority.role,
                constituency: authority.constituency,
                actedAt: new Date()
            }
        }, { new: true });
        if (!budget) return res.status(404).json({ message: "Budget not found" });
        res.json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
