const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const ApprovalAuthority = require("../models/ApprovalAuthority");
const { authorityMatchesBudget } = require("../utils/approvalRouting");

router.post("/add", async (req, res) => {
    try {
        const { title, financialYear, state, department, allocatedAmount, allocationDate, description, source } = req.body;
        if (!financialYear || !department || !Number.isFinite(Number(allocatedAmount)) || Number(allocatedAmount) <= 0) {
            return res.status(400).json({ message: "financialYear, department, and a positive allocatedAmount are required" });
        }

        const budgetDetails = {
            state: state || 'All India',
            department
        };
        const authorities = await ApprovalAuthority.find({ active: true });
        const assignedAuthorityIds = authorities
            .filter((authority) => authorityMatchesBudget(authority, budgetDetails))
            .map((authority) => authority.authorityId);

        const budget = await Budget.create({
            title,
            financialYear,
            state: state || 'All India',
            department,
            allocatedAmount: Number(allocatedAmount),
            allocationDate: allocationDate || new Date(),
            description,
            source,
            assignedAuthorityIds
        });
        res.status(201).json({
            ...budget.toObject(),
            assignedAuthorityCount: assignedAuthorityIds.length
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const filter = req.query.state ? { state: req.query.state } : {};
        const [budgets, authorities] = await Promise.all([
            Budget.find(filter).sort({ allocationDate: -1 }),
            ApprovalAuthority.find({ active: true })
        ]);
        await Promise.all(budgets.map(async (budget) => {
            if (budget.status !== 'Pending Approval' || (budget.assignedAuthorityIds || []).length) {
                return;
            }

            const assignedAuthorityIds = authorities
                .filter((authority) => authorityMatchesBudget(authority, budget))
                .map((authority) => authority.authorityId);
            if (assignedAuthorityIds.length) {
                budget.assignedAuthorityIds = assignedAuthorityIds;
                await budget.save();
            }
        }));
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
        if (!authority) return res.status(403).json({ message: "Only active registered authorities can act" });
        const budget = await Budget.findById(req.params.id);
        if (!budget) return res.status(404).json({ message: "Budget not found" });

        const isAssigned = (budget.assignedAuthorityIds || []).includes(authority.authorityId);
        if (!isAssigned || !authorityMatchesBudget(authority, budget)) {
            return res.status(403).json({ message: "This authority is not assigned to the budget's department and state" });
        }

        budget.status = status;
        budget.approval = {
            authorityId: authority.authorityId,
            authorityName: authority.name,
            authorityRole: authority.role,
            constituency: authority.constituency,
            actedAt: new Date()
        };
        await budget.save();
        res.json(budget);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;
