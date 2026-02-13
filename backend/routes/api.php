<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Auth\AuthController;
use App\Modules\LibrarySessions\LibrarySessionController;
use App\Modules\Books\BookIssueController;
use App\Modules\Notifications\NotificationController;
use App\Modules\Books\BookController;
use App\Modules\Analytics\AnalyticsController;
use App\Modules\Admin\AdminController;

// Public Auth Routes
Route::post('/login', [AuthController::class, 'login'])->name('login')->middleware('throttle:5,1');
Route::post('/register', [AuthController::class, 'register']);

// Public/Kiosk Routes
Route::post('/sessions/log', [LibrarySessionController::class, 'logSession']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/update-password', [AuthController::class, 'updatePassword']);

    // Book Catalog (Global for authenticated users)
    Route::get('/books', [BookController::class, 'index']);
    Route::get('/books/stats', [BookController::class, 'getStats']);

    // Book Circulation (Librarian/Admin)
    Route::middleware('role:librarian,admin')->group(function () {
        Route::post('/books/issue', [BookIssueController::class, 'issueBook']);
        Route::post('/books/return', [BookIssueController::class, 'returnBook']);
        Route::post('/books/fine-adjust', [BookIssueController::class, 'updateFine']);
        Route::get('/books/issued-active', [BookIssueController::class, 'getActiveIssues']);
        Route::get('/books/fines-unpaid', [BookIssueController::class, 'getUnpaidFines']);
        Route::get('/analytics', [AnalyticsController::class, 'getAnalytics']);
        Route::post('/books', [BookController::class, 'store']);
        
        // Admin Only Control Panel
        Route::middleware('role:admin')->group(function () {
            Route::get('/admin/staff', [AdminController::class, 'listStaff']);
            Route::post('/admin/staff', [AdminController::class, 'createLibrarian']);
            Route::post('/admin/users/{id}/toggle', [AdminController::class, 'toggleUserStatus']);
            Route::get('/admin/config/fines', [AdminController::class, 'getFineConfig']);
            Route::post('/admin/config/fines', [AdminController::class, 'updateFineConfig']);
            Route::get('/admin/export/users', [AdminController::class, 'exportUsers']);
        });
        
        // Sessions
        Route::get('/sessions/live', [LibrarySessionController::class, 'getLiveStudents']);
        Route::get('/sessions/today', [LibrarySessionController::class, 'getTodaySessions']);
        Route::get('/sessions/stats', [LibrarySessionController::class, 'getSessionStats']);
    });

    // Student Routes
    Route::middleware('role:student')->group(function () {
        Route::get('/my-issues', [BookIssueController::class, 'getActiveIssues']);
        Route::get('/my-history', [BookIssueController::class, 'getBorrowingHistory']);
        Route::get('/my-sessions', [LibrarySessionController::class, 'getUserSessions']);
    });

    // Notifications (Shared)
    Route::get('/notifications', [NotificationController::class, 'getMyNotifications']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
});
