-- FarmLink MySQL Database Schema
-- Production-Ready DDL Script

CREATE DATABASE IF NOT EXISTS farmlink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE farmlink_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    role ENUM('farmer', 'buyer') NOT NULL,
    organization_name VARCHAR(255) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Produce Listings Table (Grade A, B, C quality standard)
CREATE TABLE IF NOT EXISTS produce_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    min_order_quantity DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
    base_price_per_unit DECIMAL(10, 2) NOT NULL,
    location VARCHAR(255) DEFAULT NULL,
    harvest_date DATE DEFAULT NULL,
    quality_grade ENUM('Grade A', 'Grade B', 'Grade C') NOT NULL,
    quality_notes TEXT,
    image_url VARCHAR(500) DEFAULT NULL,
    status ENUM('active', 'sold_out', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_produce_category (category),
    INDEX idx_produce_grade (quality_grade),
    INDEX idx_produce_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Negotiation Offers Table (Strict FSM: Pending, Countered, Accepted, Rejected, Expired)
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    farmer_id INT NOT NULL,
    proposed_price_per_unit DECIMAL(10, 2) NOT NULL,
    proposed_quantity DECIMAL(12, 2) NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status ENUM('Pending', 'Countered', 'Accepted', 'Rejected', 'Expired') NOT NULL DEFAULT 'Pending',
    last_action_by ENUM('buyer', 'farmer') NOT NULL,
    last_action_user_id INT NOT NULL,
    counter_notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_offers_buyer (buyer_id),
    INDEX idx_offers_farmer (farmer_id),
    INDEX idx_offers_status (status),
    INDEX idx_offers_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Orders Table (Pending Payment -> Confirmed -> Dispatched -> Delivered)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_id INT NOT NULL UNIQUE,
    buyer_id INT NOT NULL,
    farmer_id INT NOT NULL,
    listing_id INT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',
    price_per_unit DECIMAL(10, 2) NOT NULL,
    status ENUM('Pending Payment', 'Confirmed', 'Dispatched', 'Delivered') NOT NULL DEFAULT 'Pending Payment',
    delivery_address TEXT,
    dispatch_notes TEXT DEFAULT NULL,
    tracking_number VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE RESTRICT,
    FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (farmer_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (listing_id) REFERENCES produce_listings(id) ON DELETE RESTRICT,
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payments Table (Razorpay Escrow & Webhook Reconciliations)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_payment_id VARCHAR(100) DEFAULT NULL,
    razorpay_signature VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status ENUM('created', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'upi',
    webhook_verified BOOLEAN NOT NULL DEFAULT FALSE,
    raw_payload TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_rzp_order (razorpay_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
