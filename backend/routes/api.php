<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserAddressController;
use App\Http\Controllers\CouponController;  
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AdminShopController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReviewController;

use App\Http\Controllers\OrderProcessingController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\ChatController;

use App\Http\Controllers\StatisticsController;

use App\Http\Controllers\NotificationController;
use App\Http\Controllers\MembershipTierController;
use App\Http\Controllers\AdminUserController;


/*
|--------------------------------------------------------------------------
| 1. KHU VỰC CÔNG KHAI (Không cần đăng nhập)
|--------------------------------------------------------------------------
*/
// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);

// Products & Categories (Ai cũng xem được)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']); 
Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
Route::post('/payment/momo', [PaymentController::class, 'createMoMoPayment']);
Route::get('/payment/momo-callback', [PaymentController::class, 'momoCallback']);
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK'
    ]);
});

// SHOP(REGISTER SELLER)
Route::get('/provinces', function () {
    return Http::get("https://provinces.open-api.vn/api/p")->json();
});   
Route::get('/provinces/{code}', function ($code) {
    return Http::get("https://provinces.open-api.vn/api/p/$code?depth=2")->json();
});
Route::get('/districts/{code}', function ($code) {
    return Http::get("https://provinces.open-api.vn/api/d/$code?depth=2")->json();
});

/* ----------------------- Review (USER) ----------------------- */
Route::get('/reviews', [ReviewController::class, 'index']);

/*
|--------------------------------------------------------------------------
| 2. PROTECTED ROUTES (Cần đăng nhập)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- Lấy thông tin user & Hạng (Cả User và Admin đều dùng chung cái này) ---
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('membership.tier');
        return response()->json($user);
    });

    // FIX LỖI 403: Chuyển route xem danh sách hạng ra ngoài nhóm Admin
    Route::get('/membership-tiers', [MembershipTierController::class, 'index']);

    // FIX LỖI 404 LOGOUT: Thêm route logout ở đây
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::put('/user/update', [UserController::class, 'updateProfile']);
    Route::post('/user/update-avatar', [UserController::class, 'updateAvatar']);

    
    /* ----------------------- THÔNG BÁO ----------------------- */
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    
    /* ----------------------- GIỎ HÀNG ----------------------- */
    Route::get('/cart', [CartController::class, 'getCart']);
    Route::post('/cart/add', [CartController::class, 'addToCart']);
    Route::put('/cart/update', [CartController::class, 'updateCart']);
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']);
    Route::get('/shipping-methods', [OrderController::class, 'getShippingMethods']);
    Route::get('/payment-methods', [OrderController::class, 'getPaymentMethods']);

    /* ----------------------- ĐƠN HÀNG ----------------------- */
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/complete', [OrderController::class, 'confirmReceipt']);
    Route::get('/vouchers/checkout', [CouponController::class, 'getAvailableVouchers']);
    /* ----------------------- ORDER HISTORIES (User) ----------------------- */
    Route::middleware('user')->group(function () {
        Route::get('/order-histories', [OrderProcessingController::class, 'userIndex']);
        Route::get('/order-histories/{orderId}', [OrderProcessingController::class, 'userShow']);
        Route::post('/conversations', [ChatController::class, 'createConversation']);

        /* ----------------------- PRODUCT REVIEWS (User) ----------------------- */
        Route::get('/product-reviews', [ProductReviewController::class, 'index']);
        Route::post('/product-reviews', [ProductReviewController::class, 'store']);
        Route::put('/product-reviews/{reviewId}', [ProductReviewController::class, 'update']);
        Route::delete('/product-reviews/{reviewId}', [ProductReviewController::class, 'destroy']);
    });

    /* ----------------------- CHAT (User & Seller) ----------------------- */
    Route::get('/conversations', [ChatController::class, 'listConversations']);
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'listMessages']);
    Route::post('/conversations/{conversationId}/messages', [ChatController::class, 'sendMessage']);

    /* ----------------------- SELLER ORDER MANAGEMENT ----------------------- */
    Route::middleware('seller')->group(function () {
        Route::get('/seller/orders', [OrderProcessingController::class, 'sellerIndex']);
        Route::post('/seller/orders/{orderId}/confirm', [OrderProcessingController::class, 'confirm']);
        Route::post('/seller/orders/{orderId}/shipping', [OrderProcessingController::class, 'shipping']);
        Route::post('/seller/orders/{orderId}/complete', [OrderProcessingController::class, 'completed']);
        Route::post('/seller/orders/{orderId}/cancel', [OrderProcessingController::class, 'cancelled']);
    });

    /* ----------------------- ĐỊA CHỈ ----------------------- */
    Route::get('/user/addresses', [UserAddressController::class, 'index']);
    Route::post('/user/addresses', [UserAddressController::class, 'store']);
    Route::put('/user/addresses/{id}', [UserAddressController::class, 'update']);
    Route::delete('/user/addresses/{id}', [UserAddressController::class, 'destroy']);
    Route::put('/user/addresses/{id}/default', [UserAddressController::class, 'setDefault']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);

    /* ----------------------- COUPON ----------------------- */
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);

    /* ----------------------- THANH TOÁN ----------------------- */
    Route::post('/payment/vnpay', [PaymentController::class, 'createPayment']);

    /* ----------------------- SHOP (SELLER) ----------------------- */
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/my-shop', [ShopController::class, 'myShop']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/seller/orders', [OrderController::class, 'getSellerOrders']);
    Route::put('/seller/orders/{id}/status', [OrderController::class, 'updateOrderStatus']);
    Route::get('/seller/statistics', [StatisticsController::class, 'sellerDashboard']);
    Route::get('/seller/settings/auto-confirm', [OrderController::class, 'getAutoConfirmSetting']);
    Route::post('/seller/settings/auto-confirm', [OrderController::class, 'toggleAutoConfirm']);
    Route::get('/seller/products/{id}/forecast', [StatisticsController::class, 'getProductForecast']);

    
        /* ----------------------- Review (USER) ----------------------- */


        Route::post('/reviews', [ReviewController::class, 'store']);
    
});

/*
|--------------------------------------------------------------------------
| 3. ADMIN ROUTES (with auth + admin middleware)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Admin quản lý Categories
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Shop approve
    Route::get('/admin/shops', [AdminShopController::class, 'index']);
    Route::put('/admin/shops/{id}/approve', [AdminShopController::class, 'approve']);
    Route::put('/admin/shops/{id}/reject', [AdminShopController::class, 'reject']);

    // Statistics
    Route::get('/admin/statistics', [StatisticsController::class, 'adminDashboard']);

    

    /*
    |--------------------------------------------------------------------------
    | 3. ADMIN ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {
        // Admin quản lý Categories
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Shop approve
        Route::get('/admin/shops', [AdminShopController::class, 'index']);
        Route::put('/admin/shops/{id}/approve', [AdminShopController::class, 'approve']);

        // Statistics & Membership Tiers (Quản lý)
        Route::get('/admin/statistics', [StatisticsController::class, 'adminDashboard']);
        
        // Chỉ để lại các route Thêm/Sửa/Xóa hạng cho Admin
        Route::get('/admin/membership-tiers', [MembershipTierController::class, 'index']);
        Route::post('/admin/membership-tiers', [MembershipTierController::class, 'store']);
        Route::put('/admin/membership-tiers/{id}', [MembershipTierController::class, 'update']);
        Route::delete('/admin/membership-tiers/{id}', [MembershipTierController::class, 'destroy']);
        
        // Quản lý Coupon toàn sàn
        Route::get('/admin/coupons', [CouponController::class, 'adminIndex']);
        Route::post('/admin/coupons', [CouponController::class, 'adminStore']);
        Route::delete('/admin/coupons/{id}', [CouponController::class, 'adminDestroy']);

        // Quản lý Users (CRUD + soft delete)
        Route::get('/admin/users', [AdminUserController::class, 'index']);
        Route::get('/admin/users/{id}', [AdminUserController::class, 'show']);
        Route::post('/admin/users', [AdminUserController::class, 'store']);
        Route::put('/admin/users/{id}', [AdminUserController::class, 'update']);
        Route::post('/admin/users/{id}/soft-delete', [AdminUserController::class, 'softDelete']);
        Route::get('/admin/users/{id}/confirm-deletion', [AdminUserController::class, 'confirmDeletion']);
        Route::get('/admin/users/{id}/cancel-deletion', [AdminUserController::class, 'cancelDeletion']);
    });
});