-- Mock data for affiliates_affiliate table
-- Run this SQL in your PostgreSQL database to populate some example affiliates

INSERT INTO affiliates_affiliate (first_name, last_name, email, coupon_code, is_active, created_at, updated_at) VALUES
('John', 'Doe', 'john.doe@example.com', 'JOHN50', true, NOW(), NOW()),
('Jane', 'Smith', 'jane.smith@example.com', 'JANESMITH10', true, NOW(), NOW()),
('Alex', 'Johnson', 'alex.j@example.com', 'ALEXJ25', true, NOW(), NOW()),
('Sarah', 'Williams', 'sarah.w@example.com', 'SARAH30', true, NOW(), NOW()),
('Michael', 'Brown', 'michael.b@example.com', 'MBROWN15', false, NOW(), NOW());
