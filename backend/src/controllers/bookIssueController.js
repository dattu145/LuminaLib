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
            .is('returned_date', null);

        if (activeIssues && activeIssues.length >= 3) {
            return res.status(422).json({ message: 'User has reached maximum limit of 3 issued books' });
        }

        // Check if user already has THIS exact book
        const hasThisBook = activeIssues?.some(issue => issue.book_id === book.id);
        if (hasThisBook) {
            return res.status(422).json({ message: 'User already has a copy of this book' });
        }

        // Issue the book — 15 days default
        const finalDueDate = due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

        const { data: newIssue, error: issueError } = await supabase
            .from('book_issues')
            .insert([{
                user_id: user.id,
                book_id: book.id,
                issued_date: new Date().toISOString(),
                due_date: finalDueDate,
                status: 'issued',
            }])
            .select()
            .single();

        if (issueError) throw issueError;

        // Decrement available copies
        await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', book.id);

        res.json({ message: 'Book issued successfully', due_date: new Date(finalDueDate).toISOString() });

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

        const { data: issue } = await supabase
            .from('book_issues')
            .select('*')
            .eq('user_id', user.id)
            .eq('book_id', book.id)
            .is('returned_date', null)
            .single();

        if (!issue) return res.status(404).json({ message: 'No active issue found for this book and user' });

        const { error: updateError } = await supabase
            .from('book_issues')
            .update({ returned_date: new Date().toISOString(), status: 'returned' })
            .eq('id', issue.id);

        if (updateError) throw updateError;

        await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', book.id);

        res.json({ message: 'Book returned successfully' });

    } catch (err) {
        console.error('Return book error:', err);
        res.status(500).json({ message: 'Failed to return book' });
    }
};

export const returnBookById = async (req, res) => {
    try {
        const { issue_id } = req.body;
        if (!issue_id) return res.status(400).json({ message: 'issue_id is required' });

        const { data: issue } = await supabase
            .from('book_issues')
            .select('*, book:books(id, available_copies)')
            .eq('id', issue_id)
            .is('returned_date', null)
            .single();

        if (!issue) return res.status(404).json({ message: 'No active issue found' });

        const returnedAt = new Date();
        const dueDate = new Date(issue.due_date);
        const overdueDays = Math.max(0, Math.floor((returnedAt - dueDate) / (1000 * 60 * 60 * 24)));
        const finePerDay = issue.book?.fine_per_day || 1;
        const fineAmount = overdueDays * finePerDay;

        await supabase.from('book_issues').update({
            returned_date: returnedAt.toISOString(),
            fine_amount: fineAmount,
            status: overdueDays > 0 ? 'overdue' : 'returned'
        }).eq('id', issue_id);

        await supabase.from('books')
            .update({ available_copies: issue.book.available_copies + 1 })
            .eq('id', issue.book.id);

        res.json({ message: 'Book returned successfully', fine_amount: fineAmount, overdue_days: overdueDays });
    } catch (err) {
        console.error('Return by ID error:', err);
        res.status(500).json({ message: 'Failed to return book' });
    }
};

export const getStudentCirculationProfile = async (req, res) => {
    try {
        const { register_number } = req.params;

        const { data: student, error: userError } = await supabase
            .from('users')
            .select('id, name, email, register_number, phone, department, photo_url, is_active, role')
            .eq('register_number', register_number)
            .single();

        if (userError || !student) {
            return res.status(404).json({ message: 'Student not found with that register number' });
        }

        // Active issues (returned_date IS NULL)
        const { data: activeIssues, error: aiErr } = await supabase
            .from('book_issues')
            .select('*, book:books(id, title, book_code, author, category)')
            .eq('user_id', student.id)
            .is('returned_date', null)
            .order('issued_date', { ascending: false });

        if (aiErr) console.error('Active issues fetch error:', aiErr.message);

        // Return history (ALL issues, ordered by issue date)
        const { data: history, error: hErr } = await supabase
            .from('book_issues')
            .select('*, book:books(id, title, book_code, author)')
            .eq('user_id', student.id)
            .order('issued_date', { ascending: false })
            .limit(10);

        if (hErr) console.error('History fetch error:', hErr.message);

        // Calculate outstanding fines from active overdue books
        const now = new Date();
        let totalOutstandingFine = 0;
        const issuesWithFineCalc = (activeIssues || []).map(issue => {
            const dueDate = new Date(issue.due_date);
            const overdueDays = Math.max(0, Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)));
            const finePerDay = 1;
            const estimatedFine = overdueDays * finePerDay;
            totalOutstandingFine += estimatedFine;
            return { ...issue, overdue_days: overdueDays, estimated_fine: estimatedFine };
        });

        // Also add unpaid fines from already-returned books
        const { data: unpaidReturned } = await supabase
            .from('book_issues')
            .select('fine_amount')
            .eq('user_id', student.id)
            .eq('fine_paid', false)
            .gt('fine_amount', 0)
            .not('returned_date', 'is', null);

        if (unpaidReturned) {
            unpaidReturned.forEach(r => { totalOutstandingFine += parseFloat(r.fine_amount || 0); });
        }

        res.json({
            student,
            active_issues: issuesWithFineCalc,
            history: history || [],
            total_outstanding_fine: totalOutstandingFine,
            can_borrow: (activeIssues || []).length < 3 && totalOutstandingFine === 0
        });

    } catch (err) {
        console.error('Student profile fetch error:', err);
        res.status(500).json({ message: 'Failed to fetch student profile' });
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
                .is('returned_date', null)
                .order('issued_date', { ascending: false });
        } else {
            query = supabase
                .from('book_issues')
                .select('*, user:users(id, name, email, register_number), book:books(*)')
                .is('returned_date', null)
                .order('issued_date', { ascending: false });
        }

        const { data: issues, error } = await query;

        if (error) {
            console.error('Active issues query error (returning []):', error.message);
            return res.json([]);
        }

        res.json(issues || []);
    } catch (err) {
        console.error('Active issues error:', err);
        res.json([]);
    }
};

export const getBorrowingHistory = async (req, res) => {
    try {
        const { data: issues, error } = await supabase
            .from('book_issues')
            .select('*, book:books(*)')
            .eq('user_id', req.user.id)
            .not('returned_date', 'is', null)
            .order('returned_date', { ascending: false });

        if (error) throw error;
        res.json(issues);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch borrowing history' });
    }
};

export const getUnpaidFines = async (req, res) => {
    try {
        const { data: issues, error } = await supabase
            .from('book_issues')
            .select('*, user:users(*), book:books(*)')
            .gt('fine_amount', 0)
            .eq('fine_paid', false)
            .order('issued_date', { ascending: false });

        if (error) throw error;
        res.json(issues || []);
    } catch (err) {
        console.error('Failed to fetch unpaid fines:', err);
        res.status(500).json({ message: 'Failed to fetch unpaid fines' });
    }
};

export const adjustFine = async (req, res) => {
    try {
        const { issue_id, fine_amount, fine_paid } = req.body;

        const { error } = await supabase
            .from('book_issues')
            .update({ fine_amount, fine_paid })
            .eq('id', issue_id);

        if (error) throw error;
        res.json({ message: 'Fine adjusted successfully' });
    } catch (err) {
        console.error('Failed to adjust fine:', err);
        res.status(500).json({ message: 'Failed to adjust fine' });
    }
};
