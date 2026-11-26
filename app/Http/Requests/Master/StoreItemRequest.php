<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sku' => strtoupper(trim((string) $this->input('sku'))),
            'name' => trim((string) $this->input('name')),
            'stock_qty' => $this->input('stock_qty', 0),
            'min_stock' => $this->input('min_stock', 0),
            'avg_cost' => $this->input('avg_cost', 0),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:50', Rule::unique('items', 'sku')],
            'name' => ['required', 'string', 'max:150'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'stock_qty' => ['required', 'numeric', 'min:0', 'max:999999999999.999'],
            'min_stock' => ['required', 'numeric', 'min:0', 'max:999999999999.999'],
            'avg_cost' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'is_active' => ['required', 'boolean'],
            'specs' => ['nullable', 'array'],
            'specs.*.key' => ['required', 'string', 'max:100'],
            'specs.*.value' => ['required', 'string', 'max:255'],
            'conversions' => ['nullable', 'array'],
            'conversions.*.unit_id' => ['required', 'integer', 'exists:units,id', 'distinct'],
            'conversions.*.factor' => ['required', 'numeric', 'gt:0', 'max:99999999999.9999'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['unit_id', 'conversions'])) {
                    return;
                }

                $baseUnitId = (int) $this->input('unit_id');
                $conversions = $this->input('conversions', []);

                if (! is_array($conversions)) {
                    return;
                }

                foreach ($conversions as $index => $conversion) {
                    if (isset($conversion['unit_id']) && (int) $conversion['unit_id'] === $baseUnitId) {
                        $validator->errors()->add(
                            "conversions.{$index}.unit_id",
                            'Satuan konversi tidak boleh sama dengan satuan dasar barang.',
                        );
                    }
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
            'sku.required' => 'Kode SKU wajib diisi.',
            'sku.max' => 'Kode SKU maksimal 50 karakter.',
            'sku.unique' => 'Kode SKU sudah terdaftar.',
            'name.required' => 'Nama barang wajib diisi.',
            'name.max' => 'Nama barang maksimal 150 karakter.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak valid.',
            'unit_id.required' => 'Satuan dasar wajib dipilih.',
            'unit_id.exists' => 'Satuan dasar tidak valid.',
            'stock_qty.min' => 'Stok awal tidak boleh negatif.',
            'min_stock.min' => 'Stok minimum tidak boleh negatif.',
            'avg_cost.min' => 'Harga rata-rata tidak boleh negatif.',
            'specs.*.key.required' => 'Nama spesifikasi wajib diisi.',
            'specs.*.value.required' => 'Nilai spesifikasi wajib diisi.',
            'conversions.*.unit_id.required' => 'Satuan konversi wajib dipilih.',
            'conversions.*.unit_id.distinct' => 'Satuan konversi tidak boleh duplikat.',
            'conversions.*.factor.required' => 'Faktor konversi wajib diisi.',
            'conversions.*.factor.gt' => 'Faktor konversi harus lebih dari 0.',
        ];
    }
}
