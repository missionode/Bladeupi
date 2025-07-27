# Bladeupi

# UPI Transaction Library

A lightweight JavaScript library for handling UPI (Unified Payments Interface) transaction cases, including error codes, statuses, and handling advice. This library is designed to assist developers in interpreting UPI transaction responses, simulating scenarios, and integrating with UPI systems.

## Features
- **Error Code Interpretation**: Lookup detailed information for over 80 UPI error codes, including description, type (Business/Technical/Success), status (Processed/Pending/Rejected), and recommended handling actions. Now includes mandate-specific codes.

  **Simple Usage Example:**
  ```javascript
  const { getCodeInfo } = require('./upi-transaction-library');
  console.log(getCodeInfo('AP01'));
  // Output: { code: 'AP01', description: 'Account blocked', type: 'Business', status: 'Rejected', handling: 'Account is blocked; contact bank.' }
