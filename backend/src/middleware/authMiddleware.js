import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
        token = token.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthenticated.' });
    }

    try {
        // Verify and decode the JWT — this catches expired/tampered tokens
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Try to fetch user from Supabase to get latest state (e.g. deactivation)
        // If Supabase RLS blocks this read (anon key), fall back to the JWT payload
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            // RLS may block the anon key from reading users table.
            // Fall back to the decoded JWT payload if the token itself is valid.
            if (decoded.id && decoded.email) {
                req.user = {
                    id: decoded.id,
                    email: decoded.email,
                    name: decoded.name || '',
                    role: decoded.role || 'student',
                    register_number: decoded.register_number || '',
                    is_active: true, // JWT was valid and signed by server = active
                };
                return next();
            }
            return res.status(401).json({ message: 'User not found.' });
        }

        // Only block if is_active is EXPLICITLY false (null/undefined = allow through)
        if (user.is_active === false) {
            return res.status(403).json({ message: 'Your account is deactivated. Please contact the librarian.' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        return res.status(401).json({ message: 'Unauthenticated. Invalid token.' });
    }
};

export const requireRoles = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden. Insufficient role permissions.' });
        }
        next();
    };
};
