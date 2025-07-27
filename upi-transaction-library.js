// upi-transaction-library.js
// A small JavaScript library for handling UPI transaction cases, statuses, and error codes.
// Updated version: Added dispute reason codes from recent NPCI chargeback rules (OC 184B). Introduced a function for retrieving dispute info.

// Enum-like object for UPI Transaction Statuses
const UPIStatus = Object.freeze({
  SUCCESS: "Processed",
  PENDING: "Pending",
  REJECTED: "Rejected"
});

// Enum-like object for UPI Transaction Types
const UPITransactionType = Object.freeze({
  PAY: "Pay Request (Push)",
  COLLECT: "Collect Request (Pull)",
  INTENT: "UPI Intent-Based Payment",
  AUTOPAY: "UPI Autopay",
  LITE: "UPI Lite",
  ASBA: "UPI for ASBA"
});

// Object mapping general UPI error codes to their details: [description, type, status, handling]
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
  "YD": ["Do not honour (beneficiary)", "Business", UPIStatus.REJECTED, "Same."],
  // Note: 'U3' updated to 'Business' type as per common categorization.
});

// Object mapping mandate-specific error codes to their details: [description, type, status, handling]
const MandateErrorCodes = Object.freeze({
  "AP01": ["Account blocked", "Business", UPIStatus.REJECTED, "Account is blocked; contact bank."],
  "AP02": ["Account closed", "Business", UPIStatus.REJECTED, "Account is closed; use another account."],
  "AP03": ["Account frozen", "Business", UPIStatus.REJECTED, "Account frozen; contact bank."],
  "AP04": ["Account inoperative", "Business", UPIStatus.REJECTED, "Account dormant; activate with bank."],
  "AP05": ["No such account", "Business", UPIStatus.REJECTED, "Invalid account; check details."],
  "AP06": ["Not a CBS account no. or old account no. represented with CBS no", "Business", UPIStatus.REJECTED, "Invalid account format; update to CBS."],
  "AP07": ["Refer to the branch – KYC not completed", "Business", UPIStatus.REJECTED, "Complete KYC at branch."],
  "AP08": ["Account holder name mismatch with CBS", "Business", UPIStatus.REJECTED, "Name mismatch; verify details."],
  "AP09": ["Account type in mandate is different from CBS", "Business", UPIStatus.REJECTED, "Account type mismatch; correct it."],
  "AP10": ["Amount exceeds e-mandate limit", "Business", UPIStatus.REJECTED, "Exceeds limit; reduce amount."],
  "AP11": ["Authentication failed", "Technical", UPIStatus.REJECTED, "Auth failed; retry authentication."],
  "AP12": ["Amount of EMI more than limit allowed for the account", "Business", UPIStatus.REJECTED, "EMI exceeds limit; adjust."],
  "AP13": ["Invalid monthly EMI amount. Full loan amount mentioned", "Technical", UPIStatus.REJECTED, "Invalid EMI; specify correct amount."],
  "AP14": ["Invalid user credentials", "Technical", UPIStatus.REJECTED, "Wrong credentials; re-enter."],
  "AP15": ["Mandate not registered – not maintaining required balance", "Business", UPIStatus.REJECTED, "Insufficient balance for registration."],
  "AP16": ["Mandate not registered – minor account", "Business", UPIStatus.REJECTED, "Minor account; not allowed."],
  "AP17": ["Mandate not registered – NRE account", "Business", UPIStatus.REJECTED, "NRE account; not supported."],
  "AP18": ["Mandate registration not allowed for CC account", "Business", UPIStatus.REJECTED, "Credit card account; use savings/current."],
  "AP19": ["Mandate registration not allowed for PF account", "Business", UPIStatus.REJECTED, "PF account; not supported."],
  "AP20": ["Mandate registration not allowed for PPF account", "Business", UPIStatus.REJECTED, "PPF account; not supported."],
  "AP21": ["Payment stopped by attachment order", "Business", UPIStatus.REJECTED, "Stopped by order; contact bank."],
  "AP22": ["Payment stopped by court order", "Business", UPIStatus.REJECTED, "Court order; resolve legally."],
  "AP23": ["Transaction rejected or cancelled by the customer", "Business", UPIStatus.REJECTED, "Customer cancelled; reinitiate if needed."],
  "AP24": ["Account not in regular status", "Business", UPIStatus.REJECTED, "Irregular account; regularize."],
  "AP25": ["Withdrawal stopped owing to insolvency of account", "Business", UPIStatus.REJECTED, "Insolvency; contact bank."],
  "AP26": ["Withdrawal stopped owing to lunacy of account holder", "Business", UPIStatus.REJECTED, "Legal issue; resolve."],
  "AP27": ["Invalid frequency", "Technical", UPIStatus.REJECTED, "Wrong frequency; correct mandate."],
  "AP28": ["Mandate registration failed – please contact your home branch", "Business", UPIStatus.REJECTED, "Contact branch for assistance."],
  "AP29": ["Technical errors or connectivity issues at backend", "Technical", UPIStatus.REJECTED, "Backend issue; retry later."],
  "AP30": ["Browser closed by customer mid-transaction", "Business", UPIStatus.REJECTED, "Transaction aborted; restart."],
  "AP31": ["Mandate registration not allowed for joint account", "Business", UPIStatus.REJECTED, "Joint account; use individual."],
  "AP32": ["Mandate registration not allowed for wallet account", "Business", UPIStatus.REJECTED, "Wallet; use bank account."],
  "AP33": ["User rejected the transaction on pre-login page", "Business", UPIStatus.REJECTED, "User rejected; try again."],
  "AP34": ["Account number not registered with netbanking facility", "Business", UPIStatus.REJECTED, "Enable netbanking."],
  "AP35": ["Debit card validation failed – invalid card number", "Technical", UPIStatus.REJECTED, "Invalid card; check number."],
  "AP36": ["Debit card validation failed – invalid expiry date", "Technical", UPIStatus.REJECTED, "Invalid expiry; check date."],
  "AP37": ["Debit card validation failed – invalid PIN", "Technical", UPIStatus.REJECTED, "Wrong PIN; retry."],
  "AP38": ["Debit card validation failed – invalid CVV", "Technical", UPIStatus.REJECTED, "Wrong CVV; check."],
  "AP39": ["OTP invalid", "Technical", UPIStatus.REJECTED, "Invalid OTP; regenerate."],
  "AP40": ["Maximum tries exceeded for OTP", "Technical", UPIStatus.REJECTED, "OTP tries exceeded; wait and retry."],
  "AP41": ["Time expired for OTP", "Technical", UPIStatus.REJECTED, "OTP expired; regenerate."],
  "AP42": ["Debit card not activated", "Business", UPIStatus.REJECTED, "Activate card."],
  "AP43": ["Debit card blocked", "Business", UPIStatus.REJECTED, "Card blocked; unblock."],
  "AP44": ["Debit card hotlisted", "Business", UPIStatus.REJECTED, "Card hotlisted; report lost."],
  "AP45": ["Debit card expired", "Business", UPIStatus.REJECTED, "Card expired; renew."],
  "AP46": ["No response received from customer during transaction", "Business", UPIStatus.REJECTED, "No response; retry transaction."],
  "AP47": ["Account number registered for only view rights in netbanking", "Business", UPIStatus.REJECTED, "View-only; enable transactions."],
  "AP48": ["Aadhaar number does not match with debtor", "Business", UPIStatus.REJECTED, "Aadhaar mismatch; verify."],
  "AP65": ["Account number not linked with given debit card", "Business", UPIStatus.REJECTED, "Link account with debit card."],
  "AP66": ["No response received from bank within prescribed time limit", "Technical", UPIStatus.REJECTED, "Bank timeout; retry later."]
});

// Object mapping UPI dispute reason codes to their details: [description, disputeType, tat, flag]
const DisputeReasonCodes = Object.freeze({
  "U2": ["Credit not Processed", "Chargeback", "T+5", "U2"],
  "U3": ["Goods/Services not as described/defective", "Chargeback", "T+5", "U3"],
  "U4": ["Duplicate Processing", "Chargeback", "T+5", "U4"],
  "U5": ["Fraud", "Chargeback", "T+5", "U5"],
  "U6": ["Payment not received", "Chargeback", "T+5", "U6"],
  "U7": ["Incorrect Amount", "Chargeback", "T+5", "U7"],
  "U8": ["Transaction Debited Twice", "Chargeback", "T+5", "U8"],
  "U9": ["Paid by Alternate Means", "Chargeback", "T+5", "U9"],
  "U10": ["Goods/Services not received", "Chargeback", "T+5", "U10"],
  "U11": ["Other", "Chargeback", "T+5", "U11"]
  // Based on standard UPI chargeback rules, updated per recent circulars. TAT is turnaround time in days.
});

// Function to get information about a UPI error code (checks general, mandate)
function getCodeInfo(code) {
  const upperCode = code.toUpperCase();
  let codes = {...UPIErrorCodes, ...MandateErrorCodes};
  if (codes[upperCode]) {
    const [description, type, status, handling] = codes[upperCode];
    return { code: upperCode, description, type, status, handling };
  }
  return { code: upperCode, description: "Unknown", type: "Technical", status: UPIStatus.REJECTED, handling: "Contact support" };
}

// Function to get information about a UPI dispute reason code
function getDisputeInfo(code) {
  const upperCode = code.toUpperCase();
  if (DisputeReasonCodes[upperCode]) {
    const [description, disputeType, tat, flag] = DisputeReasonCodes[upperCode];
    return { code: upperCode, description, disputeType, tat, flag };
  }
  return { code: upperCode, description: "Unknown Dispute", disputeType: "Chargeback", tat: "T+5", flag: "Unknown" };
}

// Function to simulate a UPI transaction
function simulateTransaction(transactionType = UPITransactionType.PAY, successRate = 0.8) {
  if (!Object.values(UPITransactionType).includes(transactionType)) {
    throw new Error("Invalid transaction type");
  }

  const codes = Object.keys(UPIErrorCodes);
  let code;
  if (Math.random() < successRate) {
    code = "00"; // Success
  } else {
    const failureCodes = codes.filter(c => c !== "00" && c !== "000");
    code = failureCodes[Math.floor(Math.random() * failureCodes.length)];
  }

  const info = getCodeInfo(code);
  return { transactionType, ...info };
}

// Function to simulate a mandate registration
function simulateMandateRegistration(successRate = 0.8) {
  const codes = Object.keys(MandateErrorCodes);
  let code;
  if (Math.random() < successRate) {
    code = "00"; // Success
  } else {
    code = codes[Math.floor(Math.random() * codes.length)];
  }

  const info = getCodeInfo(code);
  return { transactionType: "Mandate Registration", ...info };
}

// Function to handle edge cases by suggesting actions
function handleEdgeCase(code) {
  const info = getCodeInfo(code);
  let suggestedAction = info.handling;

  if (info.status === UPIStatus.PENDING) {
    suggestedAction += " Monitor for resolution.";
  } else if (info.type.includes("Technical") && info.status === UPIStatus.REJECTED) {
    suggestedAction += " Retry after a short delay.";
  } else if (info.type.includes("Business")) {
    suggestedAction += " User intervention required; do not retry automatically.";
  }

  return { code: info.code, suggestedAction };
}

// Example usage:
// console.log(getDisputeInfo("U3"));
// Output: { code: 'U3', description: 'Goods/Services not as described/defective', disputeType: 'Chargeback', tat: 'T+5', flag: 'U3' }

module.exports = { UPIStatus, UPITransactionType, UPIErrorCodes, MandateErrorCodes, DisputeReasonCodes, getCodeInfo, simulateTransaction, simulateMandateRegistration, handleEdgeCase, getDisputeInfo };
