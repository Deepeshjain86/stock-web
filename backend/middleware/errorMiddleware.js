export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err.message, err.stack);
  
  let statusCode = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Map MySQL-specific database errors to user-friendly messages
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
      case 1062:
        statusCode = 400;
        message = 'A record with this identifier (such as email, barcode, name, or code) already exists. Please choose a unique value.';
        break;
      case 'ER_ROW_IS_REFERENCED_2':
      case 'ER_ROW_IS_REFERENCED':
      case 1451:
        statusCode = 400;
        message = 'Cannot delete or modify this record because it is currently linked to other transactions (e.g. sales, purchases, or ledger entries) in the system.';
        break;
      case 'ER_NO_REFERENCED_ROW_2':
      case 'ER_NO_REFERENCED_ROW':
      case 1452:
        statusCode = 400;
        message = 'Reference integrity failure. The linked record (such as category, supplier, or product) does not exist in the database.';
        break;
      case 'ER_DATA_TOO_LONG':
      case 1406:
        statusCode = 400;
        message = 'Character limit exceeded. One or more fields contain text that is too long for the database column.';
        break;
      default:
        break;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
