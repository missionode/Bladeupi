# Bladeupi

# UPI Transaction Library

A lightweight JavaScript library for handling UPI (Unified Payments Interface) transaction cases, including error codes, statuses, and handling advice. This library is designed to assist developers in interpreting UPI transaction responses, simulating scenarios, and integrating with UPI systems.

## Features
- **Error Code Interpretation**: Lookup detailed information for over 80 UPI error codes, including description, type (Business/Technical/Success), status (Processed/Pending/Rejected), and recommended handling actions.
- **Status and Transaction Type Enums**: Predefined statuses and transaction types for quick reference in transaction flows.
- **Transaction Simulation**: Mock UPI transaction outcomes with customizable success rates and transaction types. Useful for testing without real API calls.
- **Extensible**: Built with object literals for easy extension; future updates will add edge case handlers, API wrappers for aggregators like Razorpay or Decentro, and more.
- **Current Version**: 1.1.0 (Updated July 27, 2025). No external dependencies; pure JavaScript for Node.js or browser compatibility.

## Installation
Since this is a single-file library, you can simply download `upi-transaction-library.js` and require it in your project.

For Node.js:
```bash
npm init -y  # If starting a new project
# Then copy the JS file into your project directory
