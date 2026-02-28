import { supabase } from '../config/supabase.js';

export const getAnalytics = async (req, res) => {
    try {
        // High level numbers
        const { count: totalBooks } = await supabase.from('books').select('*', { count: 'exact', head: true });
        const { count: activeStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true);
        const { count: totalIssues } = await supabase.from('book_issues').select('*', { count: 'exact', head: true }).is('returned_at', null);

        // Fetch session data for trend
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentSessions } = await supabase
            .from('library_sessions')
            .select('login_time')
            .gte('login_time', thirtyDaysAgo.toISOString());

        // Process sessions into a 30-day map
        // This is a simplified Node.js equivalent of Laravel's DB group-by approach
        const visitorTrendObj = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            visitorTrendObj[d.toISOString().split('T')[0]] = 0;
        }

        if (recentSessions) {
            recentSessions.forEach(session => {
                const dateKey = session.login_time.split('T')[0];
                if (visitorTrendObj[dateKey] !== undefined) {
                    visitorTrendObj[dateKey]++;
                }
            });
        }

        const visitorTrackLength = Object.keys(visitorTrendObj).map(date => ({
            date,
            visits: visitorTrendObj[date]
        }));

        res.json({
            summary: {
                total_books: totalBooks || 0,
                active_students: activeStudents || 0,
                books_issued: totalIssues || 0,
            },
            visitor_trend: visitorTrackLength,
            popular_books: [] // Placeholder if needed
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
};
