const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const auth = require('../middleware/auth');

router.post('/', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      url: req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
