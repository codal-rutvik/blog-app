const Joi = require("joi");
const multer = require("multer");
const { validateData } = require("../common/joiValidator");
const Blog = require("../models/blogPost");
const mongoose = require("mongoose");

const uploadImage = (req, res, next) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const date = new Date().toISOString();
      const uploadFileName = `image_${date}_${file.originalname}`;
      cb(null, uploadFileName);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, JPG, and PNG file types are allowed"));
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 1 * 1024 * 1024,
    },
  }).single("image");

  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ error: "File size should not exceed 1 MB" });
        }
      }
      console.error(err);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const createSlug = (title, id) => {
  return `${title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "-")
    .substring(0, 100)}-${id}`;
};

const getBlogPosts = async (req, res, next) => {
  try {
    const { tags, title, slug } = req.query;
    if (slug) {
      const singleBlogPost = await Blog.findOne({
        slug: slug,
        status: "published",
      }).select("-favorites -__v");

      if (!singleBlogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      res.status(200).json({ data: singleBlogPost });
    } else if (title) {
      const blogPostsByTitle = await Blog.find({
        title: { $regex: title, $options: "i" },
        status: "published",
      }).select("-favorites -__v");

      if (blogPostsByTitle.length === 0) {
        return res
          .status(404)
          .json({ message: `No blog posts found with the title '${title}'` });
      }

      res.status(200).json({ data: blogPostsByTitle });
    } else if (tags) {
      const blogPostsByTags = await Blog.find({
        tags: { $in: tags.split(",").map((tag) => tag.toLowerCase()) },
        status: "published",
      }).select("-favorites -__v");

      if (blogPostsByTags.length === 0) {
        return res
          .status(404)
          .json({ message: "No blog posts found with the provided tags" });
      }

      res.status(200).json({ data: blogPostsByTags });
    } else {
      const allBlogPosts = await Blog.find({
        status: "published",
      }).select("-favorites -__v");

      res.status(200).json({ data: allBlogPosts });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid blogId. Please provide a valid blog identifier.",
        });
      }

      const singleBlogPost = await Blog.findOne({
        _id: id,
        status: "published",
      }).select("-favorites -__v");

      if (!singleBlogPost) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      res.status(200).json({ data: singleBlogPost });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const createBlogPost = async (req, res, next) => {
  try {
    uploadImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "Error uploading image" });
      }

      const userData = req.user;
      const blogSchema = Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        author: Joi.string().required(),
        tags: Joi.array().items(Joi.string()),
        status: Joi.string().valid("published", "draft").default("published"),
      });

      const blogFormData = {
        title: req.body.title,
        description: req.body.description,
        author: userData?.userId,
        tags: req.body.tags.map((tag) => tag.toLowerCase()) || [],
        status: req.body.status,
      };

      const { error } = blogSchema.validate(blogFormData);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const image = req.file ? req.file.path : "";

      const blogId = new mongoose.Types.ObjectId();
      const slug = createSlug(req?.body?.title, blogId);

      const newBlog = new Blog({
        _id: blogId,
        title: req.body.title,
        description: req.body.description,
        author: userData?.userId,
        tags: req.body.tags.map((tag) => tag.toLowerCase()) || [],
        status: req.body.status,
        slug,
        image,
      });

      await newBlog.save();

      res
        .status(201)
        .json({ message: "Blog post created successfully", blog: newBlog });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const updateBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    uploadImage(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: "Error uploading image" });
      }

      const blogSchema = Joi.object({
        title: Joi.string(),
        description: Joi.string(),
        tags: Joi.array().items(Joi.string()),
        status: Joi.string().valid("published", "draft").default("published"),
      });

      const validatedData = validateData(req.body, blogSchema);

      if (typeof validatedData === "string") {
        return res.status(400).json({ error: validatedData });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid blogId. Please provide a valid blog identifier.",
        });
      }

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({ error: "Blog post not found" });
      }

      if (blog.author.toString() !== userId) {
        return res.status(403).json({
          error:
            "Permission denied. You do not have the necessary permissions.",
        });
      }

      const updateFields = {};

      if (validatedData.title) updateFields.title = validatedData.title;
      if (validatedData.description)
        updateFields.description = validatedData.description;
      if (validatedData.tags) updateFields.tags = validatedData.tags;
      if (validatedData.status)
        updateFields.status = validatedData.status.toLowerCase();
      if (req.file) updateFields.image = req.file.path;

      await Blog.updateOne({ _id: id }, { $set: updateFields });

      res.status(200).json({ message: "Blog post updated successfully" });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid blogId. Please provide a valid blog identifier.",
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    if (blog.author.toString() !== userId) {
      return res.status(403).json({
        error: "Permission denied. You do not have the necessary permissions.",
      });
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const likeBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid blogId. Please provide a valid blog identifier.",
      });
    }

    // Check if the blog post exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    if (blog.likes.includes(userId)) {
      blog.likes = blog.likes.filter((likeId) => likeId.toString() !== userId);
      blog.likesCount -= 1;

      await blog.save();
      return res.status(200).json({
        message: "Blog post unliked successfully",
        likesCount: blog.likesCount,
      });
    }

    blog.likes.push(userId);
    blog.likesCount += 1;

    await blog.save();
    res.status(200).json({
      message: "Blog post liked successfully",
      likesCount: blog.likesCount,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const favoriteBlogPost = async (req, res, next) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid blogId. Please provide a valid blog identifier.",
      });
    }

    const blogPost = await Blog.findById(id);

    if (!blogPost) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const isFavorited = blogPost.favorites.includes(userId);

    if (isFavorited) {
      // User has already favorited, so unfavorite
      blogPost.favorites = blogPost.favorites.filter(
        (id) => id.toString() !== userId
      );
      blogPost.favoriteCount -= 1;
    } else {
      // User has not favorited, so favorite
      blogPost.favorites.push(userId);
      blogPost.favoriteCount += 1;
    }

    await blogPost.save();

    const message = isFavorited
      ? "Blog post unfavorited successfully"
      : "Blog post favorited successfully";

    res.status(200).json({ message, favoriteCount: blogPost.favoriteCount });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  getBlogPosts,
  getBlog,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  likeBlogPost,
  favoriteBlogPost,
};
