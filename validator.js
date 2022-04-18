const {check} = require('express-validator')
module.exports = {
   
  validateConfirmPassword : check('confirm_password')
 
    // To delete leading and trailing space
    .trim()
 
    // Validate minimum length of password
    // Optional for this context
    .isLength({min:4, max:16})
 
    // Custom message
    .withMessage('Password must be between 4 to 16 characters')
 
    // Custom validation
    // Validate confirm_password
    .custom(async (confirm_password, {req}) => {
      const password = req.body.password
 
      // If password and confirm password not same
      // don't allow to sign up and throw error
      if(password !== confirm_password){
        throw new Error('Passwords must be same')
      }
    }),
}