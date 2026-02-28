import { supabase } from '../config/supabase.js';

export const logSession = async (req, res) => {
    try {
        const { register_number } = req.body;

        const { data: user } = await supabase.from('users').select('id, name, is_active').eq('register_number', register_number).single();
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.is_active) return res.status(403).json({ message: 'User account is deactivated' });

        // Check if user has an active session
        const { data: activeSession } = await supabase
            .from('library_sessions')
            .select('*')
            .eq('user_id', user.id)
            .is('logout_time', null)
            .single();

        if (activeSession) {
            // Log out
            const { error: updateError } = await supabase
                .from('library_sessions')
                .update({ logout_time: new Date().toISOString() })
                .eq('id', activeSession.id);

            if (updateError) throw updateError;
            return res.json({ message: `Goodbye, ${user.name}!` });
        } else {
            // Log in
            const { error: insertError } = await supabase
                .from('library_sessions')
                .insert([{
                    user_id: user.id,
                    login_time: new Date().toISOString()
                }]);

            if (insertError) throw insertError;
            return res.json({ message: `Welcome, ${user.name}!` });
        }
    } catch (err) {
        console.error('Log session error:', err);
        res.status(500).json({ message: 'Failed to log session' });
    }
};

export const getLiveStudents = async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('library_sessions')
            .select('*, user:users(*)')
            .is('logout_time', null)
            .order('login_time', { ascending: false });

        if (error) throw error;
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch live sessions' });
    }
};

export const getTodaySessions = async (req, res) => {
    try {
        // Find today's date boundary
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: sessions, error } = await supabase
            .from('library_sessions')
            .select('*, user:users(*)')
            .gte('login_time', today.toISOString())
            .order('login_time', { ascending: false });

        if (error) throw error;
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch today sessions' });
    }
};

export const getUserSessions = async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('library_sessions')
            .select('*')
            .eq('user_id', req.user.id)
            .order('login_time', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Get user sessions error:', error);
            // Return empty array instead of throwing — table might not have records yet
            return res.json([]);
        }
        res.json(sessions || []);
    } catch (err) {
        console.error('User sessions error:', err);
        res.status(500).json({ message: 'Failed to fetch user sessions' });
    }
};

export const getSessionStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Active right now count
        const { count: currentlyActive, error: err1 } = await supabase
            .from('library_sessions')
            .select('*', { count: 'exact', head: true })
            .is('logout_time', null);

        // Unique visitors today count - JS Set because Supabase select distinct on user_id might be tricky without RPC
        const { data: todaySessions, error: err2 } = await supabase
            .from('library_sessions')
            .select('user_id')
            .gte('login_time', today.toISOString());

        const uniqueVisitorsSet = new Set(todaySessions?.map(s => s.user_id));
        const uniqueVisitorsCount = uniqueVisitorsSet.size;

        res.json({
            currently_active: currentlyActive || 0,
            total_today: todaySessions?.length || 0,
            unique_visitors_today: uniqueVisitorsCount,
            weekly_trend: [] // Placeholder for simplified Node.js response. Should be filled with 7-day data if needed
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
