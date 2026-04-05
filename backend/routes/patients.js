const express = require('express');
const router  = express.Router();
const prisma  = require('../lib/prisma');

// ── Patient code generation ───────────────────────────────────────
// ✅ FIX: instead of count()-based codes (which race under concurrent
//    requests and break when patients are deleted), we read the highest
//    existing code and increment from there. We then retry up to 5
//    times if two simultaneous requests collide on the unique constraint.
async function generatePatientCode() {
  const last = await prisma.patient.findFirst({
    orderBy: { patientCode: 'desc' },
    select:  { patientCode: true },
  });

  if (!last) return 'DEN-0001';

  // patientCode format is always "DEN-NNNN"
  const num = parseInt(last.patientCode.split('-')[1], 10);
  return `DEN-${String(num + 1).padStart(4, '0')}`;
}

// POST /api/patients — create new patient
router.post('/', async (req, res) => {
  const {
    name, gender, age, dob, address,
    country, registrationDate,
    assignedDoctor, contactNumbers, remarks
  } = req.body;

  // ✅ FIX: retry loop handles the rare race where two requests
  //    generate the same code simultaneously. Prisma error P2002 =
  //    unique constraint violation.
  const MAX_RETRIES = 5;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      // Basic input validation
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
        return res.status(400).json({ error: 'Invalid age value.' });
      }
      const parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth.' });
      }

      const patientCode = await generatePatientCode();

      const patient = await prisma.patient.create({
        data: {
          patientCode,
          name,
          gender,
          age:              parsedAge,
          dob:              parsedDob,
          country:          country || 'India',
          registrationDate: registrationDate ? new Date(registrationDate) : undefined,
          address,
          assignedDoctor,
          contactNumbers:   contactNumbers || [],
          remarks,
          treatmentPlan: { create: {} },
          billing:       { create: { estimatedTotal: 0, totalPaid: 0, balanceDue: 0 } },
        },
        include: { treatmentPlan: true, billing: true },
      });

      return res.json(patient);

    } catch (err) {
      // P2002 = unique constraint failure — try again with a fresh code
      if (err.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        attempt++;
        continue;
      }
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
});

// GET /api/patients — list all patients (with search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
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
          { name:        { contains: search, mode: 'insensitive' } },
          { patientCode: { contains: search, mode: 'insensitive' } },
          ...(contactMatchIds.length ? [{ id: { in: contactMatchIds } }] : []),
        ],
      } : undefined,
      include:  { billing: true },
      orderBy:  { createdAt: 'desc' },
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
        billing:       { include: { history: { orderBy: { changedAt: 'desc' } } } },
        visits:        { orderBy: { visitDate: 'desc' } },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/patients/treatment-history/:historyId — delete one history snapshot
// ⚠️  MUST be defined BEFORE router.delete('/:id') so Express matches the
//    specific path first. If it comes after, Express treats "treatment-history"
//    as the patient :id and returns 404 "Patient not found" every time.
router.delete('/treatment-history/:historyId', async (req, res) => {
  try {
    await prisma.treatmentHistory.delete({ where: { id: req.params.historyId } });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'History entry not found.' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/patients/:id — permanently delete patient and all related data
// ✅ FIX: schema.prisma now has onDelete: Cascade on all relations so
//    Prisma handles child-record cleanup automatically. This route just
//    deletes the Patient row and the DB cascades the rest.
//    (Keep this comment so the next dev understands why it looks simple.)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.patient.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    // P2025 = record not found
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/:id — edit patient details
// ✅ FIX: whitelist the fields that are allowed to be updated.
//    Previously this passed req.body directly to Prisma, which allowed
//    any authenticated user to overwrite patientCode, id, isActive, etc.
router.patch('/:id', async (req, res) => {
  try {
    const {
      name, gender, age, dob, address,
      country, registrationDate,
      assignedDoctor, contactNumbers, remarks, isActive,
    } = req.body;

    // Validate age/dob if provided
    let parsedAge, parsedDob;
    if (age !== undefined) {
      parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
        return res.status(400).json({ error: 'Invalid age value.' });
      }
    }
    if (dob !== undefined) {
      parsedDob = new Date(dob);
      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({ error: 'Invalid date of birth.' });
      }
    }

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: {
        // Only include fields that were actually sent in the request
        ...(name             !== undefined && { name }),
        ...(gender           !== undefined && { gender }),
        ...(age              !== undefined && { age: parsedAge }),
        ...(dob              !== undefined && { dob: parsedDob }),
        ...(country          !== undefined && { country }),
        ...(registrationDate !== undefined && { registrationDate: new Date(registrationDate) }),
        ...(address          !== undefined && { address }),
        ...(assignedDoctor   !== undefined && { assignedDoctor }),
        ...(contactNumbers   !== undefined && { contactNumbers }),
        ...(remarks          !== undefined && { remarks }),
        ...(isActive         !== undefined && { isActive }),
      },
    });

    res.json(patient);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Patient not found.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/:id/treatment — update treatment plan
router.patch('/:id/treatment', async (req, res) => {
  try {
    const { upperRight, upperLeft, lowerRight, lowerLeft, general, comment, changedBy } = req.body;

    const current = await prisma.treatmentPlan.findUnique({ where: { patientId: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Treatment plan not found.' });

    // Save the PREVIOUS (before-state) values as the history snapshot.
    // Standard audit-log pattern: history = "what it looked like before this edit".
    // The live plan is always the source of truth.
    // Deleting a snapshot is therefore always safe — it never affects the current plan.
    await prisma.treatmentHistory.create({
      data: {
        treatmentPlanId: current.id,
        upperRight: current.upperRight,
        upperLeft:  current.upperLeft,
        lowerRight: current.lowerRight,
        lowerLeft:  current.lowerLeft,
        general:    current.general,
        comment,
        changedBy,
      },
    });

    // Update the live plan
    const updated = await prisma.treatmentPlan.update({
      where: { patientId: req.params.id },
      data:  { upperRight, upperLeft, lowerRight, lowerLeft, general },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;