<?php

namespace App\Modules\Analytics;

use App\Http\Controllers\Controller;
use App\Models\BookIssue;
use App\Models\LibrarySession;
use App\Models\Book;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function getAnalytics()
    {
        return response()->json([
            'most_borrowed' => $this->getMostBorrowedBooks(),
            'monthly_fines' => $this->getMonthlyFines(),
            'overdue_trends' => $this->getOverdueTrends(),
            'peak_hours' => $this->getPeakHours(),
        ]);
    }

    private function getMostBorrowedBooks()
    {
        return Book::select('books.title', DB::raw('count(book_issues.id) as borrow_count'))
            ->join('book_issues', 'books.id', '=', 'book_issues.book_id')
            ->groupBy('books.id', 'books.title')
            ->orderBy('borrow_count', 'desc')
            ->limit(5)
            ->get();
    }

    private function getMonthlyFines()
    {
        // For the last 6 months
        $start = Carbon::now()->subMonths(6)->startOfMonth();
        
        return BookIssue::select(
                DB::raw("to_char(updated_at, 'YYYY-MM') as month"),
                DB::raw('SUM(fine_amount) as total_fines')
            )
            ->where('fine_paid', true)
            ->where('updated_at', '>=', $start)
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get();
    }

    private function getOverdueTrends()
    {
        $start = Carbon::now()->subDays(30);
        
        return BookIssue::select(
                DB::raw("due_date::date as date"),
                DB::raw('count(*) as count')
            )
            ->where('status', '!=', 'returned')
            ->where('due_date', '<', Carbon::now())
            ->where('due_date', '>=', $start)
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();
    }

    private function getPeakHours()
    {
        return LibrarySession::select(
                DB::raw('EXTRACT(HOUR FROM check_in_time) as hour'),
                DB::raw('count(*) as count')
            )
            ->where('check_in_time', '>=', Carbon::now()->subDays(30))
            ->groupBy('hour')
            ->orderBy('hour', 'asc')
            ->get();
    }
}
