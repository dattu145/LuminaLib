import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimeRemainingProps {
    dueDate: string;
    finePerDay?: number;
}

const TimeRemaining: React.FC<TimeRemainingProps> = ({ dueDate, finePerDay = 10 }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [estimatedFine, setEstimatedFine] = useState<number>(0);
    const [isOverdue, setIsOverdue] = useState<boolean>(false);

    useEffect(() => {
        const calculate = () => {
            const now = new Date();
            const due = new Date(dueDate);
            const diff = due.getTime() - now.getTime();

            if (diff > 0) {
                // Book is on track
                setIsOverdue(false);
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h remaining`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${mins}m remaining`);
                } else {
                    setTimeLeft(`${mins}m remaining`);
                }
                setEstimatedFine(0);
            } else {
                // Overdue
                setIsOverdue(true);
                const overdueDiff = now.getTime() - due.getTime();
                const daysOverdue = Math.ceil(overdueDiff / (1000 * 60 * 60 * 24));

                setTimeLeft(`${daysOverdue} days overdue`);
                setEstimatedFine(daysOverdue * finePerDay);
            }
        };

        calculate();
        const timer = setInterval(calculate, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [dueDate, finePerDay]);

    return (
        <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                <Clock size={10} />
                {timeLeft}
            </div>
            {isOverdue && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md self-start">
                    <AlertTriangle size={10} />
                    Est. Fine: ₹{estimatedFine.toFixed(2)}
                </div>
            )}
        </div>
    );
};

export default TimeRemaining;
