const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// POST /api/visits — add a visit
router.post('/', async (req, res) => {
  try {
    const {
      patientId, doctor, treatmentDoneToday,
      medicinesInstructions, paymentDelta,
      includeDuesReminder, changedBy, comment
    } = req.body;

    // 1. Create the visit
    const visit = await prisma.visit.create({
      data: {
        patientId, doctor,
        treatmentDoneToday, medicinesInstructions,
        paymentDelta: parseFloat(paymentDelta) || 0,
        includeDuesReminder: !!includeDuesReminder
      }
    });

    // 2. Update billing
    const billing = await prisma.billing.findUnique({ where: { patientId } });
    const delta = parseFloat(paymentDelta) || 0;
    let newEstimated = billing.estimatedTotal;
    let newPaid = billing.totalPaid;

    if (delta > 0) newEstimated += delta;      // new charge
    if (delta < 0) newPaid += Math.abs(delta); // payment received

    const newBalance = newEstimated - newPaid;

    // Save billing history — link to the visit so we can delete it together
    await prisma.billingHistory.create({
      data: {
        billingId: billing.id,
        visitId:   visit.id,
        prevEstimated: billing.estimatedTotal,
        prevPaid: billing.totalPaid,
        prevBalance: billing.balanceDue,
        newEstimated, newPaid, newBalance,
        comment, changedBy: changedBy || doctor
      }
    });

    await prisma.billing.update({
      where: { patientId },
      data: { estimatedTotal: newEstimated, totalPaid: newPaid, balanceDue: newBalance }
    });

    // 3. Send WhatsApp message — only attempted when WhatsApp is enabled
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    let whatsappSent = false;
    let whatsappError = null;

    if (process.env.ENABLE_WHATSAPP === 'true') {
      try {
        const { sendVisitMessage } = require('../services/whatsapp');
        await sendVisitMessage(patient, visit, newBalance, includeDuesReminder);
        whatsappSent = true;
      } catch (waErr) {
        whatsappError = waErr.message;
        console.error('⚠️  WhatsApp send failed:', waErr.message);
      }
    }

    await prisma.visit.update({
      where: { id: visit.id },
      data: { whatsappSent, whatsappError }
    });

    res.json({ visit, whatsappSent, whatsappError });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/visits/:id — delete a visit and reverse its billing effect
router.delete('/:id', async (req, res) => {
  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.id } });
    if (!visit) return res.status(404).json({ error: 'Visit not found.' });

    const billing = await prisma.billing.findUnique({ where: { patientId: visit.patientId } });
    if (!billing) return res.status(404).json({ error: 'Billing record not found.' });

    // Reverse the billing effect this visit had when it was created:
    //   delta > 0 → was added to estimatedTotal, so subtract it back
    //   delta < 0 → abs(delta) was added to totalPaid, so subtract it back
    const delta = visit.paymentDelta;
    const newEstimated = billing.estimatedTotal - (delta > 0 ? delta : 0);
    const newPaid      = billing.totalPaid      - (delta < 0 ? Math.abs(delta) : 0);
    const newBalance   = newEstimated - newPaid;

    // Run deletion + billing update + billing history cleanup atomically
    await prisma.$transaction([
      // Delete the billing history entry that was created for this visit (if any)
      prisma.billingHistory.deleteMany({ where: { visitId: req.params.id } }),
      prisma.visit.delete({ where: { id: req.params.id } }),
      prisma.billing.update({
        where: { patientId: visit.patientId },
        data: { estimatedTotal: newEstimated, totalPaid: newPaid, balanceDue: newBalance },
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') return res.status(404).json({ error: 'Visit not found.' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;