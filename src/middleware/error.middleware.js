
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    console.error(err);

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

module.exports = { notFound, errorHandler };
