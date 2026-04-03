# Sử dụng PHP 8.2
FROM php:8.2-apache

# Cài đặt các thư viện cần thiết
RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_mysql zip

# 1. Bật module rewrite của Apache (Quan trọng)
RUN a2enmod rewrite

# Thiết lập thư mục làm việc
WORKDIR /var/www/html

# Copy code vào
COPY . .

# Cài đặt thư viện Laravel
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Phân quyền
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Cấu hình cổng
ENV PORT=8080

# 2. Cấu hình trỏ về thư mục public (Bạn đã có)
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf

# 3. --- QUAN TRỌNG NHẤT: BẺ KHÓA ALLOWOVERRIDE ---
# Dòng này tìm chữ "AllowOverride None" và sửa thành "AllowOverride All" trong file cấu hình Apache
RUN sed -ri -e 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

# Lệnh chạy server (Kèm xóa cache)
CMD php artisan optimize:clear && apache2-foreground