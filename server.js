const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin');


const app = express();
const port = process.env.PORT || 4000;
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({     // Initialize Firebase Admin SDK
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://edutech-app-eecfd-default-rtdb.firebaseio.com"
});


app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));


// Default home page
app.get('/', (req, res) => {
  res.send('Welcome to the admin dashboard!');
});

app.post('/payment', function (req, res) {

  const formData = req.body;

  const passPhrase = process.env.PASSPHRASE;

  const signature = generateAPISignature(passPhrase)

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
          <input type="hidden" name="return_url" value="https://edutech-app-eecfd.web.app/" />
          <input type="hidden" name="cancel_url" value="https://edutech-app-eecfd.web.app/" />
          <input type="hidden" name="notify_url" value="https://ezamazwe-edutech-nodejs.onrender.com/notify_url" />
          <input type="hidden" name="amount" value="100.00" />
          <input type="hidden" name="subscription_type" value="1">
          <input type="hidden" name="recurring_amount" value="100.00">
          <input type="hidden" name="frequency" value="4">
          <input type="hidden" name="cycles" value="4">
          <input type="hidden" name="subscription_notify_email" value="true">
          <input type="hidden" name="subscription_notify_webhook" value="true">
          <input type="hidden" name="subscription_notify_buyer" value="true">
          <input type="hidden" name="item_name" value="Ezamazwe Edutech Premium Courses" />
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