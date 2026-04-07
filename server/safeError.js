function safeError(res, err, context = 'Unknown') {
  console.error(`❌ ${context}:`, err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({
    success: false,
    error: '伺服器內部錯誤，請稍後再試',
  });
}

module.exports = safeError;
