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
        Schema::create('goods_issue_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('goods_issue_id')
                ->constrained('goods_issues');

            $table->foreignId('item_id')
                ->constrained('items');

            $table->decimal('qty', 15, 3);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_issue_items');
    }
};
