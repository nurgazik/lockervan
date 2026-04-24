import twilio from 'twilio';

let _client;

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return _client;
}

export async function sendSMS(to, body) {
  return getClient().messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}

export async function sendPinToCustomer(phone, lockerId, netcode, rentalStart, rentalExpiry) {
  const start = new Date(rentalStart).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });
  const expiry = new Date(rentalExpiry).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });

  const body = [
    `LockerVan - Locker #${lockerId}`,
    `Your code: ${netcode}`,
    `Valid: ${start} – ${expiry}`,
    `Enter this code on the lock keypad to open.`,
  ].join('\n');

  return sendSMS(phone, body);
}

export async function alertOperator(alertType, details) {
  const lines = [
    `LockerVan ALERT: ${alertType}`,
    `Locker: ${details.lockerId}`,
    details.customerPhone ? `Phone: ${details.customerPhone}` : null,
    details.customerEmail ? `Email: ${details.customerEmail}` : null,
    `Stripe ID: ${details.stripePaymentId}`,
    `Time: ${new Date().toISOString()}`,
  ].filter(Boolean);

  return sendSMS(process.env.OPERATOR_PHONE_NUMBER, lines.join('\n'));
}
