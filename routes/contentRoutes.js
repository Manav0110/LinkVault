const express = require('express');
const { uploadContent, getContent, downloadFile, deleteContent } = require('../controllers/contentController');
const upload = require('../config/multer');

const router = express.Router();

// Upload content (text or file)
router.post('/upload', upload.single('file'), uploadContent);

// Get content by ID
router.post('/content/:id', getContent);

// Download file
router.get('/download/:id', downloadFile);

// Delete content
router.delete('/content/:id', deleteContent);

module.exports = router;