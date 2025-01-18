import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load the .env file
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
  region: process.env.AWS_REGION || 'ap-south-1',
});

export const sns = new AWS.SNS();
