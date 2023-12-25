const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin');
require("dotenv").config()


const app = express();
const port = process.env.PORT || 4000;
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({     // Initialize Firebase Admin SDK
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "hotel-booking-app-9ad18.firebaseapp.com"
});


app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN
  },
});

// Default home page
app.get('/', (req, res) => {
  res.send('Welcome to the admin dashboard!');
});

app.post('/send-contactus-email', async (req, res) => {

  try {

    const { email, firstName, lastName, subject, message } = req.body;

    // Email content and configuration
    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: process.env.MAIL_USERNAME,
      subject: subject,
      text: `Hi, \nNames: ${firstName} ${lastName}. \nEmail: ${email} \nMessage: ${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
    res.status(200).json({ message: 'Email sent successfully!' });

  } catch (error) {
    console.error('Error sending email: ', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});


app.post('/payment', function (req, res) {

  const formData = req.body;
  const amount = req.body

  const passPhrase = process.env.PASSPHRASE;

  // const signature = generateAPISignature(passPhrase)

  // const payFastUrl = 'https://wwww.payfast.co.za/eng/process';
  const payFastUrl = 'https://sandbox.payfast.co.za/eng/process';

  const htmlResponse = `
<html>
<body>
    <form action="${payFastUrl}" method="post">
         ${Object.entries(formData).map(([key, value]) => `
             <input name="${key}" type="hidden" value="${value.trim()}" />
         `).join('')}
          <input type="hidden" name="merchant_id" value="10031961" />
          <input type="hidden" name="merchant_key" value="m55oaux6bncnm" />
          <input type="hidden" name="return_url" value="https://www.example.com/success">
          <input type="hidden" name="cancel_url" value="https://www.example.com/cancel">
          <input type="hidden" name="notify_url" value="https://www.example.com/notify">
          <input type="hidden" name="item_name" value="Hotel Bookings" />
    </form>
</body>
<script>
    // Automatically submit the form when the page loads
    document.forms[0].submit();
</script>
</html>
`;
  res.send(htmlResponse);
});


// Payfast notification
app.post('/notify_url', async (req, res) => {

  try {
    const responseData = req.body;

    const user = await admin.auth().getUserByEmail(responseData.email_address);

    // Checks if the payment is complete and updates the user profile.
    if (responseData.payment_status === "COMPLETE") {

      const res = await db.collection('users').doc(user.uid).update({
        "subscription": "subscribed",
        "subscriptionStartDate": responseData.billing_date,
        "subscriptionEndDate": endDateFormatted
      });
    }

    // Respond with a success message
    res.status(200).send('Notification Received', responseData);
  } catch (error) {
    console.error("Error processing notification:", error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});