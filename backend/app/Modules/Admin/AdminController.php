<?php

namespace App\Modules\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * List all librarians and staff.
     */
    public function listStaff()
    {
        $staff = User::whereIn('role', ['librarian', 'admin'])
            ->orderBy('name')
            ->get();
        return response()->json($staff);
    }

    /**
     * Create a new librarian.
     */
    public function createLibrarian(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'register_number' => 'required|string|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'register_number' => $request->register_number,
            'password' => Hash::make($request->password),
            'role' => 'librarian',
            'is_active' => true,
        ]);

        return response()->json($user, 201);
    }

    /**
     * Update user status (Enable/Disable).
     */
    public function toggleUserStatus($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent disabling self
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot disable your own account.'], 403);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'message' => 'User status updated',
            'is_active' => $user->is_active
        ]);
    }

    /**
     * Get Fine configurations.
     */
    public function getFineConfig()
    {
        $config = DB::table('fines_configs')->first();
        return response()->json($config);
    }

    /**
     * Update Fine configurations.
     */
    public function updateFineConfig(Request $request)
    {
        $request->validate([
            'fine_per_day' => 'required|numeric|min:0',
            'max_fine_limit' => 'required|numeric|min:0',
            'grace_days' => 'required|integer|min:0',
        ]);

        DB::table('fines_configs')->updateOrInsert(
            ['id' => 1],
            [
                'fine_per_day' => $request->fine_per_day,
                'max_fine_limit' => $request->max_fine_limit,
                'grace_days' => $request->grace_days,
                'updated_at' => now(),
            ]
        );

        return response()->json(['message' => 'Configuration updated successfully']);
    }

    /**
     * Export database (Basic CSV of Users for demo).
     */
    public function exportUsers()
    {
        $users = User::all();
        $csvData = "ID,Name,Email,Role,Status\n";
        foreach ($users as $user) {
            $csvData .= "{$user->register_number},{$user->name},{$user->email},{$user->role}," . ($user->is_active ? 'Active' : 'Disabled') . "\n";
        }

        return response()->streamDownload(function () use ($csvData) {
            echo $csvData;
        }, 'users_export.csv');
    }
}
