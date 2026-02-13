<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'System Admin',
            'email' => 'admin@library.com',
            'password' => \Illuminate\Support\Facades\Hash::make('Admin@123'),
            'role' => 'admin',
            'register_number' => 'ADM-001',
            'is_active' => true,
        ]);

        \App\Models\User::create([
            'name' => 'Head Librarian',
            'email' => 'librarian@library.com',
            'password' => \Illuminate\Support\Facades\Hash::make('Librarian@123'),
            'role' => 'librarian',
            'register_number' => 'LIB-001',
            'is_active' => true,
        ]);

        \App\Models\User::create([
            'name' => 'John Student',
            'email' => 'student@library.com',
            'password' => \Illuminate\Support\Facades\Hash::make('Student@123'),
            'role' => 'student',
            'register_number' => 'STU-001',
            'is_active' => true,
        ]);
    }
}
