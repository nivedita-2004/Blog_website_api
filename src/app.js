
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();

const authRoute = require('../src/routes/auth.routes');
const postRoutes = require('../src/routes/post.routes');
const commentRoutes = require('../src/routes/comment.routes');

const {
    notFound,
    errorHandler
} = require('../src/middleware/error.middleware');

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoute);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);

// Handle unknown routes
app.use(notFound);

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
