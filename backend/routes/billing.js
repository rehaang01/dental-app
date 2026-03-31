const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// PATCH /api/billing/:patientId — manual billing update
router.patch('/:patientId', async (req, res) => {
  try {
    const { estimatedTotal, totalPaid, comment, changedBy } = req.body;
    const billing = await prisma.billing.findUnique({ where: { patientId: req.params.patientId } });

    const newBalance = estimatedTotal - totalPaid;

    await prisma.billingHistory.create({
      data: {
        billingId: billing.id,
        prevEstimated: billing.estimatedTotal,
        prevPaid: billing.totalPaid,
        prevBalance: billing.balanceDue,
        newEstimated: estimatedTotal,
        newPaid: totalPaid,
        newBalance,
        comment, changedBy
      }
    });

    const updated = await prisma.billing.update({
      where: { patientId: req.params.patientId },
      data: { estimatedTotal, totalPaid, balanceDue: newBalance }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;