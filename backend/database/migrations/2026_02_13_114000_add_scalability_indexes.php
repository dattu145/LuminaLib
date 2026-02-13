<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('register_number');
        });

        Schema::table('books', function (Blueprint $table) {
            $table->index('book_code');
            $table->index('isbn');
        });

        Schema::table('book_issues', function (Blueprint $table) {
            $table->index('due_date');
            $table->index('status');
        });

        Schema::table('library_sessions', function (Blueprint $table) {
            $table->index('check_in_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['register_number']);
        });

        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['book_code']);
            $table->dropIndex(['isbn']);
        });

        Schema::table('book_issues', function (Blueprint $table) {
            $table->dropIndex(['due_date']);
            $table->dropIndex(['status']);
        });

        Schema::table('library_sessions', function (Blueprint $table) {
            $table->dropIndex(['check_in_time']);
        });
    }
};
