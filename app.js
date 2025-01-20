import  argon2 from 'argon2';

// Hashing a password
const hashedPassword = await argon2.hash('securePassword123');
console.log(hashedPassword);
// Comparing a password
const isMatch = await argon2.verify(hashedPassword, 'securePassword123');
console.log('Password match:', isMatch);

