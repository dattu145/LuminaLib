import { supabase } from '../config/supabase.js';

export const getMyNotifications = async (req, res) => {
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Notifications fetch error (returning []):', error.message);
            return res.json([]);
        }
        res.json(notifications || []);
    } catch (err) {
        res.json([]);
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', req.user.id)
            .is('read_at', null);

        if (error) {
            console.error('Unread count error (returning 0):', error.message);
            return res.json({ count: 0 });
        }
        res.json({ count: count || 0 });
    } catch (err) {
        res.json({ count: 0 });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to mark as read' });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('user_id', req.user.id)
            .is('read_at', null);

        if (error) throw error;
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to mark all as read' });
    }
};
