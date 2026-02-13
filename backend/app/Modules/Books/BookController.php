<?php

namespace App\Modules\Books;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class BookController extends Controller
{
    /**
     * Get statistics for the dashboard.
     */
    public function getStats()
    {
        return Cache::remember('book_stats', 3600, function () {
            $totalBooks = Book::count();
            $totalCopies = Book::sum('total_copies');
            $availableCopies = Book::sum('available_copies');
            $borrowedCopies = $totalCopies - $availableCopies;
            
            $categorySummary = Book::select('category', DB::raw('count(*) as count'))
                ->groupBy('category')
                ->get();

            return [
                'total_titles' => $totalBooks,
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'borrowed_copies' => $borrowedCopies,
                'category_summary' => $categorySummary
            ];
        });
    }

    /**
     * Get all books with filtering and pagination.
     */
    public function index(Request $request)
    {
        $page = $request->get('page', 1);
        $search = $request->get('search', '');
        $category = $request->get('category', '');
        
        $cacheKey = "books_index_{$page}_{$search}_{$category}";

        return Cache::remember($cacheKey, 600, function () use ($request) {
            $query = Book::query();

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'ilike', "%{$search}%")
                      ->orWhere('author', 'ilike', "%{$search}%")
                      ->orWhere('isbn', 'ilike', "%{$search}%")
                      ->orWhere('book_code', 'ilike', "%{$search}%")
                      ->orWhere('publisher', 'ilike', "%{$search}%")
                      ->orWhere('category', 'ilike', "%{$search}%")
                      ->orWhere('rack_number', 'ilike', "%{$search}%");
                });
            }

            if ($request->filled('category')) {
                $query->where('category', $request->category);
            }

            return $query->orderBy('created_at', 'desc')->paginate(15);
        });
    }

    /**
     * Store a new book.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string|max:255',
            'category' => 'required|string|max:255',
            'isbn' => 'nullable|string|unique:books',
            'book_code' => 'required|string|unique:books',
            'total_copies' => 'required|integer|min:1',
            'rack_number' => 'nullable|string|max:50',
        ]);

        $validated['available_copies'] = $validated['total_copies'];
        $validated['is_active'] = true;

        $book = Book::create($validated);

        // Clear All Book Caches
        Cache::flush(); 

        return response()->json($book, 201);
    }
}
