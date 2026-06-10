require("dotenv").config();
const AWS = require("aws-sdk");

// Validate required env vars early
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Missing AWS credentials in environment variables");
}

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION,
    credentials: new AWS.Credentials(
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY
    ),
});

// Optional: disable EC2 metadata lookup
AWS.config.credentials.get(() => { }); // forces credential resolution

const s3 = new AWS.S3({
    apiVersion: "2006-03-01",
});

const S3_BUCKET = process.env.S3_BUCKET;

module.exports = { s3, S3_BUCKET };