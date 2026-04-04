const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Generate patient code like DEN-0001
async function generatePatientCode() {
  const count = await prisma.patient.count();
  return `DEN-${String(count + 1).padStart(4, '0')}`;
}

// POST /api/patients — create new patient
router.post('/', async (req, res) => {
  try {
    const {
      name, gender, age, dob, address,
      assignedDoctor, contactNumbers, remarks
    } = req.body;

    const patientCode = await generatePatientCode();

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        name, gender, age: parseInt(age), dob: new Date(dob),
        address, assignedDoctor,
        contactNumbers: contactNumbers || [],
        remarks,
        treatmentPlan: { create: {} },
        billing: { create: { estimatedTotal: 0, totalPaid: 0, balanceDue: 0 } }
      },
      include: { treatmentPlan: true, billing: true }
    });

    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients — list all patients (with search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    // Find IDs of patients whose contactNumbers array contains a partial match
    let contactMatchIds = [];
    if (search) {
      const rawMatches = await prisma.$queryRaw`
        SELECT id FROM "Patient"
        WHERE EXISTS (
          SELECT 1 FROM unnest("contactNumbers") AS num
          WHERE num ILIKE ${'%' + search + '%'}
        )
      `;
      contactMatchIds = rawMatches.map(r => r.id);
    }

    const patients = await prisma.patient.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { patientCode: { contains: search, mode: 'insensitive' } },
          ...(contactMatchIds.length ? [{ id: { in: contactMatchIds } }] : [])
        ]
      } : undefined,
      include: { billing: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/patients/:id — single patient with everything
router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        treatmentPlan: { include: { history: { orderBy: { changedAt: 'desc' } } } },
        billing: { include: { history: { orderBy: { changedAt: 'desc' } } } },
        visits: { orderBy: { visitDate: 'desc' } }
      }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/patients/:id — permanently delete patient and all related data
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Must delete in dependency order (no cascade in schema)
    const treatmentPlan = await prisma.treatmentPlan.findUnique({ where: { patientId: id } });
    if (treatmentPlan) {
      await prisma.treatmentHistory.deleteMany({ where: { treatmentPlanId: treatmentPlan.id } });
      await prisma.treatmentPlan.delete({ where: { patientId: id } });
    }

    const billing = await prisma.billing.findUnique({ where: { patientId: id } });
    if (billing) {
      await prisma.billingHistory.deleteMany({ where: { billingId: billing.id } });
      await prisma.billing.delete({ where: { patientId: id } });
    }

    await prisma.visit.deleteMany({ where: { patientId: id } });
    await prisma.patient.delete({ where: { id } });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/:id — edit patient details
router.patch('/:id', async (req, res) => {
  try {
    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/:id/treatment — update treatment plan
router.patch('/:id/treatment', async (req, res) => {
  try {
    const { upperRight, upperLeft, lowerRight, lowerLeft, general, comment, changedBy } = req.body;

    // Save history snapshot first
    const current = await prisma.treatmentPlan.findUnique({ where: { patientId: req.params.id } });
    await prisma.treatmentHistory.create({
      data: {
        treatmentPlanId: current.id,
        upperRight: current.upperRight,
        upperLeft: current.upperLeft,
        lowerRight: current.lowerRight,
        lowerLeft: current.lowerLeft,
        general: current.general,
        comment, changedBy
      }
    });

    // Update the plan
    const updated = await prisma.treatmentPlan.update({
      where: { patientId: req.params.id },
      data: { upperRight, upperLeft, lowerRight, lowerLeft, general }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;