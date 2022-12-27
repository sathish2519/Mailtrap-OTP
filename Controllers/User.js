const User = require('../Models/user');
const EmailVerificationSchema = require('../Models/emailVerificationToken')
const nodemailer = require('nodemailer');
const { isValidObjectId } = require('mongoose');
const { generateOTP, generateMailTransporter } = require('../Utils/Mail');


exports.Create = async (req, res) => {
    try {
        const { name, email, password } = req.body
        const oldUser = await User.findOne({ email })
        if (oldUser) {
            res.status(200).send({ message: "Email already exist", success: false })
            return;
        }
        const newUser = new User({ name, email, password })
        await newUser.save()
        // res.json({ user: req.body })

        //generating otp
        let OTP = generateOTP()

        const newEmailVerificationToken = new EmailVerificationSchema({ owner: newUser._id, token: OTP })


        await newEmailVerificationToken.save()


        // OTP NODEMAILER X MAILTRAP  Sending Mail TO user//
        var transport = generateMailTransporter()

        transport.sendMail({
            from: "readyhands.mca@gmail.com",
            to: newUser.email,
            subject: 'You are one step closer,Verify your Email-Id',
            html: `
            <p>Your verification OTP</p>
            <h1>${OTP}</h1>
            `
        })


        res.status(200).send({
            message:"please enter your otp to verify"
        })

    } catch (error) {
        res.status(401).send({ message: "Error Creating User", success: false })
        return;

    }

}
//Verify-otp Route
exports.verifyEmail = async (req, res) => {
    const { userId, OTP } = req.body;

    if (!isValidObjectId(userId)) return res.json({ error: "Invalid User" });

    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });

    if (user.isVerified) return res.json({ error: "User already Verified" });

    const token = await EmailVerificationSchema.findOne({ owner: userId })

    if (!token) return res.json({ error: "Token not Found" })

    const ismatched = await token.compaireToken(OTP)
    if (!ismatched) return res.json({ error: "Please Enter a Valid OTP!" })

    user.isVerified = true;
    await user.save()

    await EmailVerificationSchema.findByIdAndDelete(token._id)

    res.json({ result: "user Verification successfull" })

    var transport = generateMailTransporter()
    transport.sendMail({
        from: "readyhands.mca@gmail.com",
        to: user.email,
        subject: 'Greetings',
        html: `
        <h1>Welcome to Ready Hands.Thanks for choosing us.</h1>
        `
    })
}





exports.resendEmailverification = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.json({ error: "User not found" });

    if (user.isVerified) return res.json({ error: "User already Verified" });

    const alreadyhastoken = await EmailVerificationSchema.findOne({ owner: userId })

    if (alreadyhastoken) return res.json({ error: "only after onehour only you can request for another OTP" })


    let OTP = generateOTP()

    const newEmailVerificationToken = new EmailVerificationSchema({ owner: user._id, token: OTP })
    await newEmailVerificationToken.save()


    // OTP NODEMAILER X MAILTRAP  Sending Mail TO user//
    var transport = generateMailTransporter()
    
    transport.sendMail({
        from: "readyhands.mca@gmail.com",
        to: user.email,
        subject: 'You are one step closer,Verify your Email-Id',
        html: `
            <p>Your verification OTP</p>
            <h1>${OTP}</h1>
            `
    })

    res.status(200).send({ message: "New OTP has been sent to registered email address!" })


};