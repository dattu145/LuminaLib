import { supabase } from '../config/supabase.js';

export const issueBook = async (req, res) => {
    try {
        const { book_code, register_number, due_date } = req.body;

        // Fetch User
        const { data: user } = await supabase.from('users').select('*').eq('register_number', register_number).single();
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch Book
        const { data: book } = await supabase.from('books').select('*').eq('book_code', book_code).single();
        if (!book) return res.status(404).json({ message: 'Book not found' });

        if (book.available_copies <= 0) {
            return res.status(422).json({ message: 'No copies available for this book' });
        }

        // Check if user already has 3 active issues
        const { data: activeIssues } = await supabase
            .from('book_issues')
            .select('*')
            .eq('user_id', user.id)
            .is('returned_at', null);

        if (activeIssues && activeIssues.length >= 3) {
            return res.status(422).json({ message: 'User has reached maximum limit of 3 issued books' });
        }

        // Check if user already has THIS exact book
        const hasThisBook = activeIssues?.some(issue => issue.book_id === book.id);
        if (hasThisBook) {
            return res.status(422).json({ message: 'User already has a copy of this book' });
        }

        // Issue the book
        const finalDueDate = due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days from now

        const { data: newIssue, error: issueError } = await supabase
            .from('book_issues')
            .insert([{
                user_id: user.id,
                book_id: book.id,
                issued_at: new Date().toISOString(),
                due_date: finalDueDate,
            }])
            .select()
            .single();

        if (issueError) throw issueError;

        // Decrement available copies
        await supabase
            .from('books')
            .update({ available_copies: book.available_copies - 1 })
            .eq('id', book.id);

        res.json({
            message: 'Book issued successfully',
            due_date: new Date(finalDueDate).toISOString()
        });

    } catch (err) {
        console.error('Issue book error:', err);
        res.status(500).json({ message: 'Failed to issue book' });
    }
};

export const returnBook = async (req, res) => {
    try {
        const { book_code, register_number } = req.body;

        const { data: user } = await supabase.from('users').select('id').eq('register_number', register_number).single();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { data: book } = await supabase.from('books').select('id, available_copies').eq('book_code', book_code).single();
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // Find active issue
        const { data: issue } = await supabase
            .from('book_issues')
            .select('*')
            .eq('user_id', user.id)
            .eq('book_id', book.id)
            .is('returned_at', null)
            .single();

        if (!issue) return res.status(404).json({ message: 'No active issue found for this book and user' });

        // Update issue
        const { error: updateError } = await supabase
            .from('book_issues')
            .update({ returned_at: new Date().toISOString() })
            .eq('id', issue.id);

        if (updateError) throw updateError;

        // Increment available copies
        await supabase
            .from('books')
            .update({ available_copies: book.available_copies + 1 })
            .eq('id', book.id);

        res.json({ message: 'Book returned successfully' });

    } catch (err) {
        console.error('Return book error:', err);
        res.status(500).json({ message: 'Failed to return book' });
    }
};

export const getActiveIssues = async (req, res) => {
    try {
        let query;

        if (req.user.role === 'student') {
            query = supabase
                .from('book_issues')
                .select('*, book:books(*)')
                .eq('user_id', req.user.id)
                .is('returned_at', null)
                .order('issued_at', { ascending: false });
        } else {
            query = supabase
                .from('book_issues')
                .select('*, user:users(id, name, email, register_number), book:books(*)')
                .is('returned_at', null)
                .order('issued_at', { ascending: false });
        }

        const { data: issues, error } = await query;

        if (error) {
            // Supabase RLS or join failure — return empty array gracefully
            console.error('Active issues query error (returning []):', error.message);
            return res.json([]);
        }

        res.json(issues || []);
    } catch (err) {
        console.error('Active issues error:', err);
        res.json([]); // Never send 500 for this — just empty
    }
};

export const getBorrowingHistory = async (req, res) => {
    try {
        // usually for student
        const { data: issues, error } = await supabase
            .from('book_issues')
            .select('*, book:books(*)')
            .eq('user_id', req.user.id)
            .not('returned_at', 'is', null)
            .order('returned_at', { ascending: false });

        if (error) throw error;

        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch borrowing history' });
    }
};
