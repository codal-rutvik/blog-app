const Joi = require("joi");
const multer = require("multer");
const { validateData } = require("../common/joiValidator");
const Blog = require("../models/blogPost");

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
      console.error(err);
      return res.status(400).json({ error: "Error uploading image" });
    }
    next();
  });
};

const getBlogPosts = async (req, res, next) => {
  try {
    const { tags } = req.query;

    if (tags) {
      const blogPosts = await Blog.find({ tags: { $in: tags.split(",") } });

      if (blogPosts.length === 0) {
        return res
          .status(404)
          .json({ message: "No blog posts found with the provided tags" });
      }

      res.status(200).json({ blogPosts });
    } else {
      const allBlogPosts = await Blog.find();
      res.status(200).json({ allBlogPosts });
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
      });

      const blogFormData = {
        title: req.body.title,
        description: req.body.description,
        author: userData?.userId,
        tags: req.body.tags || [],
      };

      const { error } = blogSchema.validate(blogFormData);

      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const image = req.file ? req.file.path : "";

      const newBlog = new Blog({
        title: req.body.title,
        description: req.body.description,
        author: userData?.userId,
        tags: req.body.tags || [],
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

    const blogSchema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      tags: Joi.array().items(Joi.string()),
    });

    const validatedData = validateData(req.body, blogSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Update the blog post with validated data
    blog.title = validatedData.title;
    blog.description = validatedData.description;
    blog.tags = validatedData.tags || [];

    await blog.save();

    res.status(200).json({ message: "Blog post updated successfully", blog });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = { getBlogPosts, createBlogPost, updateBlogPost };
