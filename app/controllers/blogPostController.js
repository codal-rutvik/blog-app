const Joi = require("joi");
const { validateData } = require("../common/joiValidator");
const Blog = require("../models/blogPost");

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
    const userData = req.user;

    const blogSchema = Joi.object({
      title: Joi.string().required(),
      description: Joi.string().required(),
      author: Joi.string().required(),
      tags: Joi.array().items(Joi.string()),
    });

    const validatedData = validateData(req.body, blogSchema);

    if (typeof validatedData === "string") {
      return res.status(400).json({ error: validatedData });
    }

    const newBlog = new Blog({
      title: req.body.title,
      description: req.body.description,
      author: userData?.userId,
      tags: req.body.tags || [],
    });

    await newBlog.save();
    res
      .status(201)
      .json({ message: "Blog post created successfully", blog: newBlog });
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
