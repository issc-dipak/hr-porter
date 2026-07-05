// Validate all required environment variables at startup.
// This will throw immediately if critical secrets are missing,
// rather than silently running with insecure defaults.
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error(
    'FATAL: JWT_SECRET is not set in environment variables. ' +
    'Copy backend/.env.example to backend/.env and set a strong secret.'
  );
}

export const config = {
  mongodbUri:            process.env.MONGODB_URI || '',
  jwtSecret,                                          // ← never falls back to weak default
  emailFrom:             process.env.EMAIL_FROM    || 'noreply@hrcore.com',
  smtpHost:              process.env.SMTP_HOST     || 'smtp-relay.brevo.com',
  smtpPort:              parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser:              process.env.SMTP_USER     || '',
  smtpPass:              process.env.SMTP_PASS     || '',
  razorpayKeyId:         process.env.RAZORPAY_KEY_ID     || '',
  razorpayKeySecret:     process.env.RAZORPAY_KEY_SECRET || '',
  cloudinaryCloudName:   process.env.CLOUDINARY_CLOUD_NAME  || '',
  cloudinaryApiKey:      process.env.CLOUDINARY_API_KEY     || '',
  cloudinaryApiSecret:   process.env.CLOUDINARY_API_SECRET  || '',
};
