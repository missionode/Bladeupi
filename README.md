# UPI Transaction Library

A lightweight JavaScript library for handling UPI (Unified Payments Interface) transaction cases, including error codes, statuses, and handling advice. This library is designed to assist developers in interpreting UPI transaction responses, simulating scenarios, and integrating with UPI systems.

## Features
- **Error Code Interpretation**: Lookup detailed information for over 80 UPI error codes, including description, type (Business/Technical/Success), status (Processed/Pending/Rejected), and recommended handling actions.

  **Simple Usage Example:**
  ```javascript
  const { getCodeInfo } = require('./upi-transaction-library');
  console.log(getCodeInfo('u48'));
  // Output: { code: 'U48', description: 'Transaction ID is not present or not found in UPI System', type: 'Technical', status: 'Rejected', handling: 'Invalid or missing transaction ID; verify and retry status check after 2 hours if within first 2 hours.' }
