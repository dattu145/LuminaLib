<?php

namespace App\Modules\Reminders;

use App\Models\BookIssue;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookReminderMail;
use Illuminate\Support\Facades\DB;

class ReminderService
{
    private $finePerDayCache = null;

    private function getFinePerDay()
    {
        if ($this->finePerDayCache === null) {
            $config = DB::table('fines_configs')->first();
            $this->finePerDayCache = $config ? $config->fine_per_day : 10.00;
        }
        return $this->finePerDayCache;
    }
    /**
     * Generate reminders based on the schedule.
     */
    public function generateReminders()
    {
        $today = Carbon::today();
        
        // 1. 3 Days Before
        $this->remindIssuesDueOn($today->copy()->addDays(3), "Upcoming Return: 3 Days Left", "reminder");
        
        // 2. 1 Day Before
        $this->remindIssuesDueOn($today->copy()->addDays(1), "Upcoming Return: 1 Day Left", "reminder");
        
        // 3. On Due Date
        $this->remindIssuesDueOn($today, "Due Date Today: Please Return", "reminder");
        
        // 4. Overdue (Daily)
        $this->remindOverdueIssues();
    }

    private function remindIssuesDueOn($date, $title, $type)
    {
        $issues = BookIssue::with(['user', 'book'])
            ->whereDate('due_date', $date)
            ->whereNull('returned_date')
            ->where('status', '!=', 'returned')
            ->get();

        foreach ($issues as $issue) {
            $this->createNotification(
                $issue, 
                $title, 
                "Your book '{$issue->book->title}' is due on {$issue->due_date->format('M d, Y')}.", 
                $type
            );
        }
    }

    private function remindOverdueIssues()
    {
        $issues = BookIssue::with(['user', 'book'])
            ->whereDate('due_date', '<', Carbon::today())
            ->whereNull('returned_date')
            ->where('status', '!=', 'returned')
            ->get();

        foreach ($issues as $issue) {
            $overdueDays = Carbon::today()->diffInDays($issue->due_date);
            $this->createNotification(
                $issue, 
                "Overdue: Book Alert!", 
                "Your book '{$issue->book->title}' is {$overdueDays} days overdue. Please return it immediately to avoid increasing fines.", 
                "fine"
            );
        }
    }

    private function createNotification($issue, $title, $message, $type)
    {
        // Check if we already sent THIS specific notification today to avoid spamming
        $exists = Notification::where('user_id', $issue->user_id)
            ->where('title', $title)
            ->whereDate('created_at', Carbon::today())
            ->exists();

        if (!$exists) {
            Notification::create([
                'user_id' => $issue->user_id,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'read_status' => false
            ]);
            
            // Send Email
            try {
                Mail::to($issue->user->email)->send(new BookReminderMail(
                    $issue->user->name,
                    $issue->book->title,
                    $issue->due_date->format('M d, Y'),
                    $this->getFinePerDay(),
                    $title,
                    $message
                ));
                Log::info("Emailed reminder to student {$issue->user->email} for book {$issue->book->book_code}");
            } catch (\Exception $e) {
                Log::error("Failed to send email to {$issue->user->email}: " . $e->getMessage());
            }
            
            Log::info("Sent notification to student {$issue->user->register_number} for book {$issue->book->book_code}");
        }
    }
}
