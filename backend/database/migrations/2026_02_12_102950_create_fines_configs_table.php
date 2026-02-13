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
        Schema::create('fines_configs', function (Blueprint $table) {
            $table->id();
            $table->decimal('fine_per_day', 8, 2);
            $table->decimal('max_fine_limit', 8, 2);
            $table->integer('grace_days');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fines_configs');
    }
};
