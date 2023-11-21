const Comment = require("../models/comment");
const Joi = require("joi");
const { validateData } = require("../common/joiValidator");

const commentSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
});

const createComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const { userId } = req.user;

    const { blogId } = req.params;

    const validatedData = validateData(req.body, commentSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    const newComment = new Comment({
      text,
      user: userId,
      blog: blogId,
    });

    await newComment.save();

    res
      .status(201)
      .json({ message: "Comment created successfully", comment: newComment });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const validatedData = validateData(req.body, commentSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    comment.text = text;
    await comment.save();

    res.status(200).json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getAllComments = async (req, res, next) => {
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({ blog: blogId });

    if (comments.length === 0) {
      return res
        .status(404)
        .json({ message: "No comments found for the blog" });
    }

    res.status(200).json({ comments });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndDelete(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  createComment,
  updateComment,
  getAllComments,
  deleteComment,
};
