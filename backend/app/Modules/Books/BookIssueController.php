<?php

namespace App\Modules\Books;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\User;
use App\Models\AuditLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Cache;

class BookIssueController extends Controller
{
    /**
     * Handle issuing a book to a student.
     */
    public function issueBook(Request $request)
    {
        $request->validate([
            'register_number' => 'required|string|exists:users,register_number',
            'book_code' => 'required|string|exists:books,book_code',
        ]);

        $user = User::where('register_number', $request->register_number)->first();
        $book = Book::where('book_code', $request->book_code)->first();

        // 1. Check if user is active
        if (!$user->is_active) {
            return response()->json(['message' => 'User account is inactive and cannot borrow books.'], 403);
        }

        // 2. Check if book is available
        if ($book->available_copies <= 0 || !$book->is_active) {
          return response()->json(['message' => 'Book is currently not available for issue.'], 400);
        }

        // 3. Check if user already has this specific book issued (and not returned)
        $alreadyIssued = BookIssue::where('user_id', $user->id)
            ->where('book_id', $book->id)
            ->where('status', '!=', 'returned')
            ->exists();

        if ($alreadyIssued) {
            return response()->json(['message' => 'This user already has an active issue for this book.'], 400);
        }

        // 4. Check max books limit (e.g., limit of 3 for students, 5 for others)
        $activeIssuesCount = BookIssue::where('user_id', $user->id)
            ->where('status', '!=', 'returned')
            ->count();
        
        $limit = $user->role === 'student' ? 3 : 5;
        if ($activeIssuesCount >= $limit) {
            return response()->json(['message' => "User has reached the maximum limit of $limit active issues."], 400);
        }

        // Process Issue using Transaction
        return DB::transaction(function () use ($user, $book, $request) {
            // Reduce copies
            $book->decrement('available_copies');

            // Set due date (14 days from now)
            $dueDate = Carbon::now()->addDays(14);

            $issue = BookIssue::create([
                'book_id' => $book->id,
                'user_id' => $user->id,
                'issued_date' => Carbon::now(),
                'due_date' => $dueDate,
                'status' => 'issued',
                'fine_amount' => 0,
                'fine_paid' => false
            ]);

            // Log action
            AuditLog::create([
                'action_type' => 'BOOK_ISSUE',
                'performed_by' => auth()->id(),
                'target_id' => $issue->id,
                'description' => "Issued '{$book->title}' to {$user->name} ({$user->register_number})"
            ]);

            // Clear book caches
            Cache::flush();

            return response()->json([
                'message' => 'Book issued successfully',
                'due_date' => $dueDate->toFormattedDateString(),
                'issue_id' => $issue->id
            ]);
        });
    }

    /**
     * Get active issues for a user (or all if authorized)
     */
    public function getActiveIssues(Request $request)
    {
        $query = BookIssue::with(['book', 'user'])
            ->where('status', '!=', 'returned')
            ->orderBy('due_date', 'asc');

        if ($request->user()->role === 'student') {
            $query->where('user_id', $request->user()->id);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Handle returning an issued book with fine calculation.
     */
    public function returnBook(Request $request)
    {
        $request->validate([
            'issue_id' => 'required|exists:book_issues,id'
        ]);

        $issue = BookIssue::with(['book', 'user'])->findOrFail($request->issue_id);

        if ($issue->status === 'returned') {
            return response()->json(['message' => 'This book has already been returned.'], 400);
        }

        return DB::transaction(function () use ($issue) {
            $today = Carbon::now();
            $dueDate = Carbon::parse($issue->due_date);
            $fineAmount = 0;
            $overdueDays = 0;

            if ($today->gt($dueDate)) {
                $overdueDays = $today->diffInDays($dueDate);
                
                // Get fine configuration
                $config = \App\Models\FinesConfig::first();
                $finePerDay = $config ? $config->fine_per_day : 10;
                $maxFine = $config ? $config->max_fine_limit : 500;
                
                $fineAmount = min($overdueDays * $finePerDay, $maxFine);
            }

            // Update Issue Record
            $issue->update([
                'returned_date' => $today,
                'status' => 'returned',
                'fine_amount' => $fineAmount,
                'fine_paid' => $fineAmount <= 0 // If no fine, consider it paid
            ]);

            // Restore book availability
            $issue->book->increment('available_copies');

            // Log action
            AuditLog::create([
                'action_type' => 'BOOK_RETURN',
                'performed_by' => auth()->id(),
                'target_id' => $issue->id,
                'description' => "Returned '{$issue->book->title}' by {$issue->user->name}. Fine: ₹{$fineAmount} ({$overdueDays} days late)"
            ]);

            // Clear book caches
            Cache::flush();

            return response()->json([
                'message' => 'Book returned successfully',
                'fine_amount' => $fineAmount,
                'overdue_days' => $overdueDays,
                'status' => 'returned'
            ]);
        });
    }

    /**
     * Manually adjust or mark fine as paid.
     */
    public function updateFine(Request $request)
    {
        $request->validate([
            'issue_id' => 'required|exists:book_issues,id',
            'fine_amount' => 'required|numeric|min:0',
            'fine_paid' => 'required|boolean',
            'reason' => 'nullable|string'
        ]);

        $issue = BookIssue::with(['book', 'user'])->findOrFail($request->issue_id);

        return DB::transaction(function () use ($issue, $request) {
            $oldAmount = $issue->fine_amount;
            $newAmount = $request->fine_amount;

            $issue->update([
                'fine_amount' => $newAmount,
                'fine_paid' => $request->fine_paid
            ]);

            // Detailed audit log
            $statusStr = $request->fine_paid ? "Marked as PAID" : "Updated";
            $reasonStr = $request->reason ? " | Reason: {$request->reason}" : "";
            
            AuditLog::create([
                'action_type' => 'FINE_ADJUSTMENT',
                'performed_by' => auth()->id(),
                'target_id' => $issue->id,
                'description' => "{$statusStr} fine for '{$issue->book->title}' (Student: {$issue->user->register_number}). " .
                                "Changed from ₹{$oldAmount} to ₹{$newAmount}{$reasonStr}"
            ]);

            return response()->json([
                'message' => 'Fine updated successfully',
                'fine_amount' => $issue->fine_amount,
                'fine_paid' => $issue->fine_paid
            ]);
        });
    }

    /**
     * Get issues that have unpaid fines.
     */
    public function getUnpaidFines()
    {
        $issues = BookIssue::with(['book', 'user'])
            ->where('fine_amount', '>', 0)
            ->where('fine_paid', false)
            ->orderBy('issued_date', 'desc')
            ->paginate(20);

        return response()->json($issues);
    }

    /**
     * Get full borrowing history for a student.
     */
    public function getBorrowingHistory(Request $request)
    {
        $history = BookIssue::with(['book'])
            ->where('user_id', $request->user()->id)
            ->orderBy('issued_date', 'desc')
            ->paginate(15);

        return response()->json($history);
    }
}
