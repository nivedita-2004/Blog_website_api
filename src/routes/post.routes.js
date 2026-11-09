const express = require('express');
const router = express.Router();
const {createPost, getAllPost, getPostById, updatePost, deletePost} = require('../controller/post.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/',authMiddleware,createPost);
router.get('/',getAllPost);
router.get('/:postId', getPostById);
router.put('/:postId',authMiddleware,updatePost);
router.delete('/:postId', authMiddleware, deletePost);

module.exports=router;