const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const [
      todayVisits,
      totalDuesResult,
      drVanitaCount,
      drRajneeshCount,
      recentVisits,
      totalPatients,
    ] = await Promise.all([
      // Visits today
      prisma.visit.count({
        where: { visitDate: { gte: startOfToday, lt: endOfToday } }
      }),

      // Sum of all outstanding balances
      prisma.billing.aggregate({
        _sum: { balanceDue: true },
        where: { balanceDue: { gt: 0 } }
      }),

      // Patients under Dr. Vanita
      prisma.patient.count({
        where: { assignedDoctor: 'Vanita Goenka', isActive: true }
      }),

      // Patients under Dr. Rajneesh
      prisma.patient.count({
        where: { assignedDoctor: 'Rajneesh Goenka', isActive: true }
      }),

      // Last 5 visits with patient info
      prisma.visit.findMany({
        take: 5,
        orderBy: { visitDate: 'desc' },
        include: {
          patient: { select: { name: true, patientCode: true, id: true } }
        }
      }),

      // Total active patients
      prisma.patient.count({ where: { isActive: true } }),
    ]);

    res.json({
      todayVisits,
      totalDues: totalDuesResult._sum.balanceDue || 0,
      drVanitaCount,
      drRajneeshCount,
      recentVisits,
      totalPatients,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/detail?type=todayVisits|dues|drVanita|drRajneesh
router.get('/detail', async (req, res) => {
  const { type } = req.query;
  try {
    let patients = [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    if (type === 'todayVisits') {
      // distinct patients who had a visit today
      const visits = await prisma.visit.findMany({
        where: { visitDate: { gte: startOfToday, lt: endOfToday } },
        include: { patient: { include: { billing: true } } },
        orderBy: { visitDate: 'desc' },
      });
      const seen = new Set();
      patients = visits.reduce((acc, v) => {
        if (!seen.has(v.patientId)) { seen.add(v.patientId); acc.push(v.patient); }
        return acc;
      }, []);
    } else if (type === 'dues') {
      patients = await prisma.patient.findMany({
        where: { billing: { balanceDue: { gt: 0 } } },
        include: { billing: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'drVanita') {
      patients = await prisma.patient.findMany({
        where: { assignedDoctor: 'Vanita Goenka', isActive: true },
        include: { billing: true },
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'drRajneesh') {
      patients = await prisma.patient.findMany({
        where: { assignedDoctor: 'Rajneesh Goenka', isActive: true },
        include: { billing: true },
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;