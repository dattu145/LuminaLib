import { supabase } from '../config/supabase.js';

export const index = async (req, res) => {
    try {
        const { search, category, sortBy, sortOrder = 'asc', page = 1, limit = 12 } = req.query;
        let query = supabase.from('books').select('*', { count: 'exact' });

        if (search) {
            query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
        }

        if (category && category !== 'All Categories') {
            query = query.eq('category', category);
        }

        const from = (page - 1) * limit;
        const to = from + parseInt(limit) - 1;

        // Handle sorting
        if (sortBy === 'title') {
            query = query.order('title', { ascending: sortOrder === 'asc' });
        } else if (sortBy === 'available_copies') {
            query = query.order('available_copies', { ascending: sortOrder === 'asc' });
        } else {
            // Default sort: newest first
            query = query.order('created_at', { ascending: false });
        }

        query = query.range(from, to);

        const { data: books, count, error } = await query;

        if (error) throw error;

        res.json({
            data: books,
            current_page: parseInt(page),
            per_page: parseInt(limit),
            last_page: Math.ceil(count / limit),
            total: count
        });

    } catch (err) {
        console.error('Book fetch error:', err);
        res.status(500).json({ message: 'Error fetching books' });
    }
};

export const getStats = async (req, res) => {
    try {
        const { count: totalBooks, error: err1 } = await supabase.from('books').select('*', { count: 'exact', head: true });

        const { data: copiesData, error: err2 } = await supabase.from('books').select('total_copies, available_copies');
        let totalCopies = 0;
        let availableCopies = 0;

        if (copiesData) {
            copiesData.forEach(b => {
                totalCopies += b.total_copies || 0;
                availableCopies += b.available_copies || 0;
            });
        }

        const borrowedCopies = totalCopies - availableCopies;

        // Note: Supabase JS doesn't have a direct 'GROUP BY' aggregate for category count easily without RPC.
        // For stats, fetching category list is slightly expensive but works for small/mid tables.
        // An RPC is better, or we fetch distinct categories via a simple query:
        const { data: catData, error: err3 } = await supabase.from('books').select('category');

        const categoryCounts = {};
        if (catData) {
            catData.forEach(book => {
                categoryCounts[book.category] = (categoryCounts[book.category] || 0) + 1;
            });
        }

        const categorySummary = Object.keys(categoryCounts).map(cat => ({
            category: cat,
            count: categoryCounts[cat]
        }));

        res.json({
            total_titles: totalBooks || 0,
            total_copies: totalCopies,
            available_copies: availableCopies,
            borrowed_copies: borrowedCopies,
            category_summary: categorySummary
        });

    } catch (err) {
        console.error('Stats fetch error:', err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

export const store = async (req, res) => {
    try {
        // Validation handled by frontend or simple checks here
        const bookData = req.body;

        const { data: book, error } = await supabase
            .from('books')
            .insert([bookData])
            .select()
            .single();

        if (error) {
            // Handle unique constraint violations
            return res.status(422).json({ message: 'Failed to add book. ISBN or Book Code might already exist.' });
        }

        res.status(201).json({
            message: 'Book created successfully',
            book
        });
    } catch (err) {
        console.error('Book create error:', err);
        res.status(500).json({ message: 'Error creating book' });
    }
};

export const getByCode = async (req, res) => {
    try {
        const { book_code } = req.params;
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('book_code', book_code)
            .single();
        if (error || !book) return res.status(404).json({ message: 'Book not found with that code' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Error looking up book' });
    }
};
