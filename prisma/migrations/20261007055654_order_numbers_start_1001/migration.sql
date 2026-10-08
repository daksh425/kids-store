-- Customer-facing order numbers start at #1001 instead of #1.
SELECT setval(pg_get_serial_sequence('orders', 'number'), GREATEST(1000, (SELECT COALESCE(MAX(number), 0) FROM orders)));
