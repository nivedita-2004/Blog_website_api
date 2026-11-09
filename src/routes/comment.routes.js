const express = require('express');
const {createComment,getAllComments,getCommentById,updateComment,deleteComment} = require('../controller/comment.controller');
const authMiddleware= require('../middleware/auth.middleware')

const router = express.Router();

router.post('/',authMiddleware,createComment);
router.get('/',getAllComments);
router.get('/:commentId',getCommentById);
router.put('/:commentId',authMiddleware,updateComment);
router.delete('/:commentId',authMiddleware,deleteComment);

module.exports=router;