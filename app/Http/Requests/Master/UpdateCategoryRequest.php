<?php

namespace App\Http\Requests\Master;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'parent_id' => $this->input('parent_id') ?: null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('parent_id')) {
                    return;
                }

                $parentId = $this->input('parent_id');
                $category = $this->route('category');

                if (! $parentId || ! $category instanceof Category) {
                    return;
                }

                $parentIdInt = (int) $parentId;

                if ($parentIdInt === $category->id || $category->hasDescendant($parentIdInt)) {
                    $validator->errors()->add(
                        'parent_id',
                        'Kategori induk tidak boleh dirinya sendiri atau sub-kategorinya.',
                    );
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.max' => 'Nama kategori maksimal 100 karakter.',
            'parent_id.exists' => 'Kategori induk tidak valid.',
        ];
    }
}
