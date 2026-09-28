<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\FinancialController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Storefront customer view
Route::get('/', function () {
    return Inertia::render('Storefront');
})->name('storefront');

// Storefront public APIs (no auth needed)
Route::get('/api/storefront/products', [ProductController::class, 'getActiveProducts']);
Route::post('/api/storefront/orders', [OrderController::class, 'store']);

// Admin Dashboard view (requires auth)
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Admin APIs (requires auth)
Route::middleware('auth')->group(function () {
    // Products Management
    Route::get('/api/admin/products', [ProductController::class, 'index']);
    Route::post('/api/admin/products', [ProductController::class, 'store']);
    Route::post('/api/admin/products/{product}', [ProductController::class, 'update']);
    Route::delete('/api/admin/products/{product}', [ProductController::class, 'destroy']);
    Route::post('/api/admin/products/{product}/stock', [ProductController::class, 'updateStock']);

    // Orders Management
    Route::get('/api/admin/orders', [OrderController::class, 'index']);
    Route::post('/api/admin/orders/{order}/status', [OrderController::class, 'updateStatus']);

    // Raw Materials Inventory
    Route::get('/api/admin/inventory', [InventoryController::class, 'index']);
    Route::post('/api/admin/inventory', [InventoryController::class, 'store']);
    Route::post('/api/admin/inventory/{rawMaterial}', [InventoryController::class, 'update']);

    // Financial Analytics
    Route::get('/api/admin/analytics', [FinancialController::class, 'getAnalytics']);
    Route::get('/api/admin/expenses', [FinancialController::class, 'getExpenses']);
    Route::post('/api/admin/expenses', [FinancialController::class, 'storeExpense']);

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

