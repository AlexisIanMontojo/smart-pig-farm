const express = require('express');
const router = express.Router();

const pensController = require('../controllers/pens.controller');

router.get('/', pensController.getAllPens);

module.exports = router;
