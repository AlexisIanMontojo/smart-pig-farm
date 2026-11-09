const express = require('express');
const router = express.Router();

const pigsController = require('../controllers/pigs.controller');

router.get('/', pigsController.getAllPigs);
router.get('/:id', pigsController.getPigById);
router.post('/', pigsController.createPig);
router.put('/:id', pigsController.updatePig);
router.patch('/:id/archive', pigsController.archivePig);

module.exports = router;
