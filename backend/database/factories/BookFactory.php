<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Book>
 */
class BookFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $categories = ['Fiction', 'Science', 'Technology', 'Mathematics', 'Philosophy', 'History', 'Biography', 'Self-Help', 'Engineering', 'Literature'];
        
        return [
            'title' => $this->faker->sentence(3),
            'author' => $this->faker->name(),
            'publisher' => $this->faker->company(),
            'category' => $this->faker->randomElement($categories),
            'isbn' => $this->faker->isbn13(),
            'book_code' => 'BK-' . $this->faker->unique()->numberBetween(1000, 9999),
            'total_copies' => $this->faker->numberBetween(1, 15),
            'available_copies' => function (array $attributes) {
                return $attributes['total_copies'];
            },
            'rack_number' => $this->faker->randomLetter() . '-' . $this->faker->numberBetween(1, 40),
            'is_active' => true,
        ];
    }
}
