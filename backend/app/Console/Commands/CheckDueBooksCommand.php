<?php

namespace App\Console\Commands;

use App\Modules\Reminders\ReminderService;
use Illuminate\Console\Command;

class CheckDueBooksCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'books:check-due';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for book due dates and send reminders to students';

    /**
     * Execute the console command.
     */
    public function handle(ReminderService $reminderService)
    {
        $this->info('Starting reminder check...');
        $reminderService->generateReminders();
        $this->info('Reminders generated successfully.');
    }
}
