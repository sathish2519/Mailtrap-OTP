const express= require('express');
const { Create, verifyEmail,resendEmailverification } = require('../Controllers/User');
const { userValidator, validate } = require('../Middleware/Validator');

const router=express.Router()
router.post('/register',userValidator,validate,Create);
router.post('/verifyemail',verifyEmail)
router.post('/resend-verifyemail',resendEmailverification)
module.exports=router;