<?php

namespace App\Modules\LibrarySessions;

use App\Http\Controllers\Controller;
use App\Models\LibrarySession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LibrarySessionController extends Controller
{
    /**
     * Handle entry/exit via register number.
     */
    public function logSession(Request $request)
    {
        $request->validate([
            'register_number' => 'required|string|exists:users,register_number'
        ]);

        $user = User::where('register_number', $request->register_number)->first();

        if (!$user->is_active) {
            return response()->json(['message' => 'User account is inactive.'], 403);
        }

        // Check for active session
        $activeSession = LibrarySession::where('user_id', $user->id)
            ->whereNull('check_out_time')
            ->first();

        if ($activeSession) {
            // Check-out
            $checkOutTime = Carbon::now();
            $duration = $activeSession->check_in_time->diffInMinutes($checkOutTime);

            $activeSession->update([
                'check_out_time' => $checkOutTime,
                'total_duration' => $duration
            ]);

            return response()->json([
                'message' => 'Checked out successfully',
                'type' => 'checkout',
                'user' => $user->name,
                'duration' => $duration
            ]);
        } else {
            // Check-in
            $newSession = LibrarySession::create([
                'user_id' => $user->id,
                'check_in_time' => Carbon::now()
            ]);

            return response()->json([
                'message' => 'Checked in successfully',
                'type' => 'checkin',
                'user' => $user->name,
                'time' => $newSession->check_in_time->format('H:i:s')
            ]);
        }
    }

    /**
     * Get students currently in the library.
     */
    public function getLiveStudents()
    {
        $liveSessions = LibrarySession::with('user:id,name,register_number,role')
            ->whereNull('check_out_time')
            ->orderBy('check_in_time', 'desc')
            ->get();

        return response()->json($liveSessions);
    }

    /**
     * Get all sessions for today.
     */
    public function getTodaySessions()
    {
        $sessions = LibrarySession::with('user:id,name,register_number')
            ->whereDate('check_in_time', Carbon::today())
            ->orderBy('check_in_time', 'desc')
            ->paginate(30);

        return response()->json($sessions);
    }

    /**
     * Statistics for Librarian Dashboard
     */
    public function getSessionStats()
    {
        $totalToday = LibrarySession::whereDate('check_in_time', Carbon::today())->count();
        $currentlyInside = LibrarySession::whereNull('check_out_time')->count();
        
        $avgDuration = LibrarySession::whereDate('check_in_time', Carbon::today())
            ->whereNotNull('total_duration')
            ->avg('total_duration');

        return response()->json([
            'total_today' => $totalToday,
            'currently_inside' => $currentlyInside,
            'avg_duration' => round($avgDuration ?? 0)
        ]);
    }

    /**
     * Get session history for the authenticated user.
     */
    public function getUserSessions(Request $request)
    {
        $sessions = LibrarySession::where('user_id', $request->user()->id)
            ->orderBy('check_in_time', 'desc')
            ->paginate(15);

        return response()->json($sessions);
    }
}
