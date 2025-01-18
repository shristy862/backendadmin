import bcrypt from 'bcryptjs';

const debugAndComparePasswords = async (rawPassword, hashedPassword) => {
    console.log('Debugging password comparison...');
    console.log('Raw password:', rawPassword);
    console.log('Stored hashed password:', hashedPassword);

    try {
        // Extract the salt (first 29 characters of the bcrypt hash)
        const salt = hashedPassword.substring(0, 29);
        console.log('Extracted salt (for understanding purposes):', salt);

        // Use bcrypt.compare to handle proper comparison
        const isMatch = await bcrypt.compare(rawPassword, hashedPassword);

        if (isMatch) {
            console.log('Passwords match.');
        } else {
            console.log('Passwords do not match.');
        }

        return isMatch;
    } catch (error) {
        console.error('Error during password comparison:', error.message);
        throw error;
    }
};

export { debugAndComparePasswords };


// Compare raw password with hashed password from the database
// bcrypt.compare(rawPassword, hashedPasswordFromDB)
//   .then((result) => {
//     console.log("Comparison Result:", result); // This will log 'true' if the password matches
//   })
//   .catch((error) => {
//     console.error("Error during password comparison:", error);
//   });