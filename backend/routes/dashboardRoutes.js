const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMyLinks, deactivateMyLink } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/links', requireAuth, getMyLinks);
router.patch('/links/:id/deactivate', requireAuth, deactivateMyLink);

module.exports = router;
