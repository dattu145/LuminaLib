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
        Schema::table('books', function (Blueprint $table) {
            $table->index('title');
            $table->index('author');
            $table->index('category');
            $table->index('publisher');
            $table->index('rack_number');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->dropIndex(['title']);
            $table->dropIndex(['author']);
            $table->dropIndex(['category']);
            $table->dropIndex(['publisher']);
            $table->dropIndex(['rack_number']);
            $table->dropIndex(['created_at']);
        });
    }
};
