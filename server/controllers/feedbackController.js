const Feedback = require('../models/Feedback');

const createFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.create({
      student: req.user.id,
      title: req.body.title,
      message: req.body.message,
    });
    res.status(201).json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

const myFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

const allFeedback = async (_req, res, next) => {
  try {
    const feedback = await Feedback.find().populate('student', 'username email').sort({ createdAt: -1 });
    res.json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

const resolveFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', adminResponse: req.body.adminResponse || '' },
      { new: true }
    );
    res.json({ success: true, feedback });
  } catch (error) {
    next(error);
  }
};

module.exports = { createFeedback, myFeedback, allFeedback, resolveFeedback };
