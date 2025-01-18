import { sns } from '../config/awsConfig.js';

// Function to generate a 6-digit OTP
export const generateRandomOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (phoneNumber, otp) => {
    try {
      // Log the OTP and phone number to track what's being sent
      console.log(`Sending OTP to phone number: ${phoneNumber}`);
      console.log(`Generated OTP: ${otp}`);
  
      const params = {
        Message: `Your OTP is: ${otp}`,
        PhoneNumber: phoneNumber,  // Ensure this is in the correct format, e.g., +919876543210
      };
  
      // Send OTP via AWS SNS
      const result = await sns.publish(params).promise();
  
      // Log the response from SNS (including the SMS sent status)
      console.log('SMS sent successfully:', result);
  
      // Return a success response with the result
      return {
        success: true,
        message: 'OTP sent successfully!',
        data: result,
      };
    } catch (error) {
      // Log any errors that occur during the sending process
      console.error('Error sending OTP via AWS SNS:', error.message);
  
      // Return a failure response with the error message
      return {
        success: false,
        message: `Failed to send OTP: ${error.message}`,
      };
    }
  };