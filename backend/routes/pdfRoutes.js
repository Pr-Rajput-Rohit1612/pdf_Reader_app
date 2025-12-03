const express = require('express');
const router = express.Router();
const multer = require('multer');
const Pdf = require('../models/Pdf');
const fs = require('fs');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Upload PDF
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const newPdf = new Pdf({
      filename: req.file.originalname,
      filepath: req.file.filename,
      size: req.file.size
    });

    await newPdf.save();
    console.log('✅ PDF saved:', newPdf.filename);
    res.json({ message: 'PDF uploaded successfully', pdf: newPdf });
  } catch (error) {
    console.log('❌ Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all PDFs
router.get('/pdfs', async (req, res) => {
  try {
    const pdfs = await Pdf.find().sort({ uploadDate: -1 });
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete PDF
router.delete('/pdf/:id', async (req, res) => {
  try {
    const pdf = await Pdf.findById(req.params.id);
    if (!pdf) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    
    // Delete file from filesystem
    const filePath = path.join('uploads', pdf.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ File deleted:', filePath);
    }
    
    // Delete from database
    await Pdf.findByIdAndDelete(req.params.id);
    console.log('✅ PDF deleted from DB:', pdf.filename);
    
    res.json({ message: 'PDF deleted successfully' });
  } catch (error) {
    console.log('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;