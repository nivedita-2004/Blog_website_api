const mongoose  = require('mongoose');
const commentModel = require('../models/comment.model');
const postModel = require('../models/post.model');

const createComment = async(req, res)=>{
   try {
     const {content, postId} = req.body;
 
     if (typeof content !== 'string' || !content.trim()) {
     return res.status(400).json({
         message: "Valid comment content is required"
     });
 }
     if(!mongoose.isValidObjectId(postId)){
         return res.status(400).json({message: "Invalid postId"})
     }
 
     const post = await postModel.findById(postId);
 
     if(!post){
         return res.status(404).json({message: "post not found"});
     }
 
    const comment= await commentModel.create({
         content: content.trim(),
         post: postId,
         author: req.user._id
     })
 
     return res.status(201).json({
         message: "comment added",
         comment
     })
   } catch (error) {
    console.error("Error in creating comment", error);
     return res.status(500).json({message: "error in addeding comment"})
   }
}

const getAllComments = async(req,res)=>{
   try {
     const {post_id} = req.query;
     
     if(!mongoose.isValidObjectId(post_id)){
         return res.status(400).json({message: "Invalid postId"})
     }
     const post = await postModel.findById(post_id);
 
     if(!post){
         return res.status(404).json({message: "post not found"});
     }
 
     const comments = await commentModel.find({post: post_id}).populate('author','name email').sort({createdAt:-1});
 
     return res.status(200).json({
         message: "comments fetched successfully",
         comments,
         totalCount: comments.length
     })
   } catch (error) {
    console.error("Error during fetching comments", error);
      return res.status(500).json({message: "error in fetching comments"})
   }
}

const getCommentById = async(req,res)=>{
   try {
     const {commentId} = req.params;
 
     if(!mongoose.isValidObjectId(commentId)){
         return res.status(400).json({message: "Invalid commentId"});
     }
 
     const comment = await commentModel
     .findById(commentId)
     .populate('author', 'name email')
     .populate('post', 'title');
 
     if(!comment){
         return res.status(404).json({message: " Comment not found"})
     }
 
     return res.status(200).json({
        message: "comment fetched successfully",
        comment
    });
   } catch (error) {
     console.error("error in fetching comment",error);
     return res.status(500).json({message: "error in fetching response"});
   }

}

const updateComment = async(req,res)=>{
  try {
      const {commentId} = req.params;
      const {content} = req.body;
  
      if(!mongoose.isValidObjectId(commentId)){
          return res.status(400).json({message: "Invalid comment"});
      }
  
      const comment = await commentModel.findById(commentId);
  
      if(!comment){
          return res.status(404).json({message: "comment not found"})
      }
       if(comment.author.toString()!==req.user._id.toString()){
          return res.status(403).json({message: "you are not authorized to make changes"});
       }
      if(typeof content!=='string' || !content.trim()){
          return res.status(400).json({message: "content is not valid"});
      }
  
   comment.content= content.trim();

   await comment.save()
  
    return res.status(200).json({
        message: "comment updated successfully",
        comment
    });
  } catch (error) {
    console.error("error in updating comment", error);
    return res.status(500).json({message: "error in updating comment"})
  }

}

const deleteComment= async(req,res)=>{
 try {
       const {commentId} = req.params;
   
       if(!mongoose.isValidObjectId(commentId)){
           return res.status(400).json({message: "Invalid comment Id"});
       }
   
       const comment = await commentModel.findById(commentId);
   
       if(!comment){
           return res.status(404).json({message: "comment not found"});
       }
   
       if(comment.author.toString()!==req.user._id.toString()){
           return res.status(403).json({message: ' you are not authorized to make changes'});
       }
   
       await comment.deleteOne();
   
       return res.status(200).json({message: "Comment deleted successfully"});
 } catch (error) {
     console.error("error in deleting comment",error);
     return res.status(500).json({message: "error in deleting the post"});
 }
}

module.exports={
    createComment,
    getAllComments,
    getCommentById,
    updateComment,
    deleteComment
}