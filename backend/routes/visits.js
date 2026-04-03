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

    // Save billing history
    await prisma.billingHistory.create({
      data: {
        billingId: billing.id,
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

    // 3. Send WhatsApp message
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    let whatsappSent = false;
    let whatsappError = null;

    try {
      const { sendVisitMessage } = require('../services/whatsapp');
      await sendVisitMessage(patient, visit, newBalance, includeDuesReminder);
      whatsappSent = true;
    } catch (waErr) {
      whatsappError = waErr.message;
      console.error('⚠️  WhatsApp send failed:', waErr.message); // log to terminal
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

module.exports = router;