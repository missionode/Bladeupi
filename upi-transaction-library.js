// upi-transaction-library.js
// A small JavaScript library for handling UPI transaction cases, statuses, and error codes.
// This is the initial version, starting from a basic implementation.
// It includes enums-like objects for statuses and error codes, and functions to interpret codes.

// Enum-like object for UPI Transaction Statuses
const UPIStatus = Object.freeze({
  SUCCESS: "Processed",
  PENDING: "Pending",
  REJECTED: "Rejected"
});

// Object mapping error codes to their details: [description, type, status, handling]
const UPIErrorCodes = Object.freeze({
  "00": ["Approved or completed successfully", "Success", UPIStatus.SUCCESS, "No action needed."],
  "000": ["Success (alternate)", "Success", UPIStatus.SUCCESS, "Same as 00."],
  "01": ["Unable to process reversal / Account closed", "Business", UPIStatus.REJECTED, "Reinitiate with same CRN; e.g., closed account in mandate presentation."],
  "02": ["No such account", "Business", UPIStatus.REJECTED, "Invalid beneficiary; recheck details."],
  "03": ["Merchant VPA not found", "Technical", UPIStatus.REJECTED, "Invalid merchant; reinitiate."],
  "04": ["Technical decline / Balance insufficient", "Business/Technical", UPIStatus.REJECTED, "Insufficient funds; top up account."],
  "05": ["Technical failure (unauthorized request) / Not arranged for", "Business/Technical", UPIStatus.REJECTED, "Unauthorized or arrangement missing; reinitiate."],
  "091": ["Timeout", "Technical", UPIStatus.PENDING, "Wait; do not reinitiate."],
  "10": ["PIN block error", "Technical", UPIStatus.REJECTED, "Invalid PIN; retry."],
  "100": ["PI (basic) attributes of demographic data did not match", "Business", UPIStatus.REJECTED, "Aadhaar mismatch; verify details."],
  "12": ["Invalid transaction", "Technical", UPIStatus.REJECTED, "Format/issue; reinitiate."],
  "125": ["Transaction limit crossed", "Business", UPIStatus.REJECTED, "Exceeds daily limit; wait or split."],
  "13": ["Invalid amount field", "Technical", UPIStatus.REJECTED, "Amount error; correct and retry."],
  "14": ["Invalid card number", "Technical", UPIStatus.REJECTED, "Wrong card; re-enter."],
  "15": ["Issuer not live on UPI", "Technical", UPIStatus.REJECTED, "Bank not UPI-enabled; switch bank."],
  "17": ["Customer cancellation", "Business", UPIStatus.REJECTED, "User canceled; reinitiate if needed."],
  "20": ["Invalid response code", "Technical", UPIStatus.REJECTED, "System error; retry."],
  "200": ["PA (address) attributes of demographic data did not match", "Business", UPIStatus.REJECTED, "Address mismatch; update."],
  "21": ["No action taken", "Technical", UPIStatus.REJECTED, "System decline; retry."],
  "22": ["Suspected malfunction", "Technical", UPIStatus.REJECTED, "Device/issue; try another app."],
  "30": ["Invalid message format", "Technical", UPIStatus.REJECTED, "XML/format error; system fix."],
  "300": ["Biometric data did not match", "Business", UPIStatus.REJECTED, "Fingerprint/iris fail; retry."],
  "303": ["Duplicate transaction ID", "Technical", UPIStatus.REJECTED, "Already processed; check status."],
  "310": ["Duplicate fingers used", "Technical", UPIStatus.REJECTED, "Biometric duplicate; use different."],
  "311": ["Duplicate irises used", "Technical", UPIStatus.REJECTED, "Same as above."],
  "312": ["FMR and FIR cannot be used in same transaction", "Technical", UPIStatus.REJECTED, "Biometric rule violation."],
  "313": ["Single FIR record contains more than one finger", "Technical", UPIStatus.REJECTED, "Format error in biometrics."],
  "314": ["Number of FMR/FIR should not exceed 10", "Technical", UPIStatus.REJECTED, "Too many biometrics."],
  "315": ["Number of IIR should not exceed 2", "Technical", UPIStatus.REJECTED, "Iris limit exceeded."],
  "34": ["Suspected fraud", "Business", UPIStatus.REJECTED, "Risk score high; contact bank."],
  "36": ["Restricted card", "Business", UPIStatus.REJECTED, "Card blocked; use another."],
  "40": ["Invalid debit account", "Technical", UPIStatus.REJECTED, "Wrong account; select correct."],
  "400": ["OTP validation failed", "Business", UPIStatus.REJECTED, "Wrong OTP; regenerate."],
  "401": ["Unauthorized request", "Technical", UPIStatus.REJECTED, "Auth fail; login again."],
  "404": ["Record not available", "Technical", UPIStatus.REJECTED, "No data; check inputs."],
  "43": ["Lost or stolen account/card", "Business", UPIStatus.REJECTED, "Security block; report to bank."],
  "444": ["Checksum error", "Technical", UPIStatus.REJECTED, "Data integrity issue; retry."],
  "500": ["Internal server error / Invalid encryption", "Technical", UPIStatus.REJECTED, "Server down; wait and retry."],
  "510": ["Invalid XML format", "Technical", UPIStatus.REJECTED, "Message format error."],
  "AM": ["MPIN not set by customer", "Business", UPIStatus.REJECTED, "Set PIN first."],
  "B1": ["Registered mobile number changed/removed", "Business", UPIStatus.REJECTED, "Update mobile with bank."],
  "B3": ["Transaction not permitted to account (e.g., minor, NRE)", "Business", UPIStatus.REJECTED, "Account restriction."],
  "CA": ["Compliance error code for acquirer", "Business", UPIStatus.REJECTED, "Regulatory issue at merchant."],
  "CI": ["Compliance error code for issuer", "Business", UPIStatus.REJECTED, "Regulatory issue at bank."],
  "DF": ["Duplicate RRN found (beneficiary)", "Technical", UPIStatus.REJECTED, "Duplicate txn; check history."],
  "DT": ["Duplicate RRN found (remitter)", "Technical", UPIStatus.REJECTED, "Same as above."],
  "K1": ["Suspected fraud / Declined based on risk score (remitter)", "Business", UPIStatus.REJECTED, "Fraud detection."],
  "NO": ["No original request found during debit/credit", "Technical", UPIStatus.REJECTED, "Missing prior txn."],
  "PS": ["Maximum balance exceeded (beneficiary bank)", "Business", UPIStatus.REJECTED, "Account full; withdraw first."],
  "U13": ["ACK not received or invalid", "Technical", UPIStatus.REJECTED, "Comms error (older code; now split)."],
  "U16": ["Exceeded NPCI/bank limit", "Business", UPIStatus.REJECTED, "Limit hit; wait 24 hours."],
  "U3": ["Biometric data did not match (alternate)", "Business", UPIStatus.REJECTED, "Auth fail."],
  "U30": ["Generic failure (e.g., payer decline)", "Business", UPIStatus.REJECTED, "User declined collect."],
  "U4": ["Invalid encryption", "Technical", UPIStatus.REJECTED, "Security issue."],
  "U5": ["Invalid XML format (alternate)", "Technical", UPIStatus.REJECTED, "Format error."],
  "X6": ["Invalid merchant (acquirer)", "Business", UPIStatus.REJECTED, "Merchant invalid."],
  "X7": ["Merchant not reachable (acquirer)", "Technical", UPIStatus.REJECTED, "Connectivity issue."],
  "XB": ["Invalid transaction (remitter, no appropriate code)", "Technical", UPIStatus.REJECTED, "Catch-all remitter error."],
  "XC": ["Invalid transaction (beneficiary, no appropriate code)", "Technical", UPIStatus.REJECTED, "Catch-all beneficiary error."],
  "XD": ["Invalid amount (remitter)", "Technical", UPIStatus.REJECTED, "Amount error sender side."],
  "XE": ["Invalid amount (beneficiary)", "Technical", UPIStatus.REJECTED, "Amount error receiver side."],
  "XF": ["Format error (remitter)", "Technical", UPIStatus.REJECTED, "Invalid format sender."],
  "XG": ["Format error (beneficiary)", "Technical", UPIStatus.REJECTED, "Invalid format receiver."],
  "XH": ["Account does not exist (remitter)", "Business", UPIStatus.REJECTED, "Sender account invalid."],
  "XI": ["Account does not exist (beneficiary)", "Business", UPIStatus.REJECTED, "Receiver account invalid."],
  "XJ": ["Requested function not supported (remitter)", "Technical", UPIStatus.REJECTED, "Feature unavailable sender."],
  "XK": ["Requested function not supported (beneficiary)", "Technical", UPIStatus.REJECTED, "Feature unavailable receiver."],
  "XL": ["Expired card (remitter)", "Business", UPIStatus.REJECTED, "Card expired."],
  "XM": ["Expired card (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  "XN": ["No card record (remitter)", "Technical", UPIStatus.REJECTED, "No card data."],
  "XO": ["No card record (beneficiary)", "Technical", UPIStatus.REJECTED, "Same."],
  "XP": ["Transaction not permitted to cardholder (remitter)", "Business", UPIStatus.REJECTED, "Permission denied."],
  "XQ": ["Transaction not permitted to cardholder (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  "XR": ["Restricted card (remitter)", "Business", UPIStatus.REJECTED, "Restricted."],
  "XS": ["Restricted card (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  "XT": ["Cut-off in process (remitter)", "Technical", UPIStatus.REJECTED, "Maintenance window."],
  "XU": ["Cut-off in process (beneficiary)", "Technical", UPIStatus.REJECTED, "Same."],
  "XV": ["Compliance violation (remitter)", "Business", UPIStatus.REJECTED, "Regulatory block."],
  "XW": ["Compliance violation (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  "XY": ["Remitter CBS offline", "Technical", UPIStatus.REJECTED, "Sender bank down."],
  "Y1": ["Beneficiary CBS offline", "Technical", UPIStatus.REJECTED, "Receiver bank down."],
  "YA": ["Lost or stolen card (remitter)", "Business", UPIStatus.REJECTED, "Security."],
  "YB": ["Lost or stolen card (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  "YC": ["Do not honour (remitter)", "Business", UPIStatus.REJECTED, "Bank decline."],
  "YD": ["Do not honour (beneficiary)", "Business", UPIStatus.REJECTED, "Same."]
  // Additional mandate-specific codes like AP01 can be added in future updates if needed.
});

// Function to get information about a UPI error code
function getCodeInfo(code) {
  const upperCode = code.toUpperCase();
  if (UPIErrorCodes[upperCode]) {
    const [description, type, status, handling] = UPIErrorCodes[upperCode];
    return { description, type, status, handling };
  }
  return { description: "Unknown", type: "Technical", status: UPIStatus.REJECTED, handling: "Contact support" };
}

// Example usage:
// console.log(getCodeInfo("04"));
// Output: { description: 'Technical decline / Balance insufficient', type: 'Business/Technical', status: 'Rejected', handling: 'Insufficient funds; top up account.' }

// This is the starting point: a basic library with code lookup. Future updates can add simulation functions, API wrappers, or more features.
module.exports = { UPIStatus, UPIErrorCodes, getCodeInfo };
