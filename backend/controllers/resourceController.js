const Resource = require('../models/Resource');

const uploadResource = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { subjectId, title } = req.body;

    if (!subjectId || !title) {
      return res.status(400).json({ message: 'subjectId and title are required' });
    }

    const resource = await Resource.create({
      userId: req.user._id,
      subjectId,
      title,
      fileUrl: req.file.path,
      fileType: req.file.mimetype.includes('pdf') ? 'pdf' : 'image',
      publicId: req.file.filename || req.file.public_id,
    });

    res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
};

const getResourcesBySubject = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    const resources = await Resource.find({
      subjectId,
    }).sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResource,
  getResourcesBySubject,
};
