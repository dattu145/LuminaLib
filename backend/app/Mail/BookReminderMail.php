<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

use Illuminate\Contracts\Queue\ShouldQueue;

class BookReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $studentName;
    public $bookTitle;
    public $dueDate;
    public $finePerDay;
    public $subjectLine;
    public $messageBody;

    /**
     * Create a new message instance.
     */
    public function __construct($studentName, $bookTitle, $dueDate, $finePerDay, $subjectLine, $messageBody)
    {
        $this->studentName = $studentName;
        $this->bookTitle = $bookTitle;
        $this->dueDate = $dueDate;
        $this->finePerDay = $finePerDay;
        $this->subjectLine = $subjectLine;
        $this->messageBody = $messageBody;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectLine,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.book-reminder',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
