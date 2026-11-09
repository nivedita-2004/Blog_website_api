const mongoose = require("mongoose");
const postModel = require("../models/post.model");

const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Valid title and content are required",
      });
    }

    const post = await postModel.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
    });

    return res.status(201).json({
      message: "post created successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      message: "error in creating post",
      error: error.message,
    });
  }
};

const getAllPost = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = Number(page);
    limit = Number(limit);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      page < 1
    ) {
      return res.status(400).json({ message: "Invalid page or limit" });
    }

    limit = Math.min(limit, 100);

    const skip = (page - 1) * limit;

    const posts = await postModel
      .find()
      .populate("author", "name email")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    const totalPost = await postModel.countDocuments();

    const totalPages = Math.ceil(totalPost / limit);

    if (page > totalPages && totalPost > 0) {
      return res.status(404).json({
        message: "Requested page does not exist",
      });
    }

    return res.status(200).json({
      message: "all posts fetched succfully",
      pagination: {
        currentPage: page,
        totalPages,
        totalPost,
        limit,
        hasNextPage: page < totalPages,
        hasPreviouspage: page > 1 && page <= totalPages,
      },
      posts,
    });
  } catch (error) {
    console.error("Pagination error:", error);
    return res.status(500).json({ message: "error in fetching posts" });
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: "Inavalid postId" });
    }
    const post = await postModel
      .findById(postId)
      .populate("author", "name email");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }
    return res.status(200).json({
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({ message: "error in fetching post" });
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: "Invalid post Id" });
    }

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Your are not authorized to make update" });
    }

    if (
      typeof title !== "string" ||
      typeof content !== "string" ||
      !title.trim() ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Valid title and content are required",
      });
    }

    post.title = title.trim();
    post.content = content.trim();

    await post.save();

    return res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update post error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to do this.." });
    }

    await post.deleteOne();

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "error in deleting post" });
  }
};

module.exports = {
  createPost,
  getAllPost,
  getPostById,
  updatePost,
  deletePost,
};
