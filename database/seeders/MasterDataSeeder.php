<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = $this->seedUnits();
        $categories = $this->seedCategories();
        $this->seedSuppliers();
        $this->seedItems($categories, $units);
    }

    /**
     * @return array<string, Unit>
     */
    private function seedUnits(): array
    {
        $definitions = [
            ['code' => 'PCS', 'name' => 'Pieces / Buah'],
            ['code' => 'LBR', 'name' => 'Lembar'],
            ['code' => 'ROLL', 'name' => 'Roll'],
            ['code' => 'BTG', 'name' => 'Batang'],
            ['code' => 'MTR', 'name' => 'Meter'],
            ['code' => 'UNIT', 'name' => 'Unit'],
            ['code' => 'BOX', 'name' => 'Box / Dus'],
            ['code' => 'PACK', 'name' => 'Pack'],
        ];

        $map = [];
        foreach ($definitions as $definition) {
            $map[$definition['code']] = Unit::query()->updateOrCreate(
                ['code' => $definition['code']],
                ['name' => $definition['name']],
            );
        }

        return $map;
    }

    /**
     * @return array<string, Category>
     */
    private function seedCategories(): array
    {
        $roots = [
            'Material Utama',
            'Kelistrikan',
            'Rangka & Profil',
            'Finishing & Stiker',
            'Aksesoris & Fastener',
            'Peralatan & Mesin',
        ];

        $map = [];
        foreach ($roots as $rootName) {
            $map[$rootName] = Category::query()->firstOrCreate(
                ['name' => $rootName, 'parent_id' => null],
            );
        }

        $children = [
            ['name' => 'Akrilik', 'parent' => 'Material Utama'],
            ['name' => 'Aluminium Composite Panel', 'parent' => 'Material Utama'],
            ['name' => 'LED & Modul', 'parent' => 'Kelistrikan'],
            ['name' => 'Power Supply', 'parent' => 'Kelistrikan'],
        ];

        foreach ($children as $child) {
            $map[$child['name']] = Category::query()->updateOrCreate(
                ['name' => $child['name']],
                ['parent_id' => $map[$child['parent']]->id],
            );
        }

        return $map;
    }

    private function seedSuppliers(): void
    {
        $suppliers = [
            [
                'name' => 'PT. Sumber Akrilik Nusantara',
                'phone' => '031-8432100',
                'address' => 'Jl. Rungkut Industri III No. 45, Surabaya',
            ],
            [
                'name' => 'CV. Cahaya LED Indonesia',
                'phone' => '0812-3400-8891',
                'address' => 'Komplek Pertokoan Glodok Jaya Lt. 2 Blok B-14, Jakarta Barat',
            ],
            [
                'name' => 'PT. Alumindo Profil Jaya',
                'phone' => '031-7501122',
                'address' => 'Jl. Raya Margomulyo No. 88, Surabaya',
            ],
            [
                'name' => 'CV. Mitra Stiker Grafika',
                'phone' => '0813-5772-1904',
                'address' => 'Jl. Ngagel Jaya Selatan No. 112, Surabaya',
            ],
            [
                'name' => 'PT. Teknik Elektronika Mandiri',
                'phone' => '021-6294410',
                'address' => 'Jl. Mangga Dua Raya Kav. 18, Jakarta Pusat',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::query()->updateOrCreate(
                ['name' => $supplier['name']],
                [
                    'phone' => $supplier['phone'],
                    'address' => $supplier['address'],
                ],
            );
        }
    }

    /**
     * @param  array<string, Category>  $categories
     * @param  array<string, Unit>  $units
     */
    private function seedItems(array $categories, array $units): void
    {
        $items = [
            [
                'sku' => 'ACR-001',
                'name' => 'Akrilik Susu 3mm (122x244cm)',
                'category' => 'Akrilik',
                'unit' => 'LBR',
                'stock_qty' => 48,
                'min_stock' => 15,
                'avg_cost' => 425000,
                'is_active' => true,
                'specs' => [
                    'Ketebalan' => '3 mm',
                    'Ukuran' => '122 x 244 cm',
                    'Warna' => 'Putih Susu',
                ],
                'conversions' => [],
            ],
            [
                'sku' => 'ACR-002',
                'name' => 'Akrilik Bening 5mm (122x244cm)',
                'category' => 'Akrilik',
                'unit' => 'LBR',
                'stock_qty' => 18,
                'min_stock' => 10,
                'avg_cost' => 680000,
                'is_active' => true,
                'specs' => [
                    'Ketebalan' => '5 mm',
                    'Ukuran' => '122 x 244 cm',
                    'Warna' => 'Bening',
                ],
                'conversions' => [],
            ],
            [
                'sku' => 'ACP-011',
                'name' => 'Aluminium Composite Panel 4mm Hitam Doff',
                'category' => 'Aluminium Composite Panel',
                'unit' => 'LBR',
                'stock_qty' => 32,
                'min_stock' => 10,
                'avg_cost' => 540000,
                'is_active' => true,
                'specs' => [
                    'Ketebalan' => '4 mm',
                    'Tipe' => 'PVDF Outdoor',
                    'Warna' => 'Hitam Doff',
                ],
                'conversions' => [],
            ],
            [
                'sku' => 'LED-014',
                'name' => 'LED Module Samsung 3 Mata 12V Putih',
                'category' => 'LED & Modul',
                'unit' => 'PCS',
                'stock_qty' => 120,
                'min_stock' => 200,
                'avg_cost' => 3200,
                'is_active' => true,
                'specs' => [
                    'Tegangan' => '12V DC',
                    'Proteksi' => 'IP68 Waterproof',
                    'Temperatur' => '6500K Cool White',
                ],
                'conversions' => [
                    ['unit' => 'PACK', 'factor' => 20],
                    ['unit' => 'BOX', 'factor' => 100],
                ],
            ],
            [
                'sku' => 'LED-019',
                'name' => 'LED Strip Neon Flex 12V Warm White',
                'category' => 'LED & Modul',
                'unit' => 'MTR',
                'stock_qty' => 85,
                'min_stock' => 30,
                'avg_cost' => 24500,
                'is_active' => true,
                'specs' => [
                    'Tegangan' => '12V DC',
                    'Lebar' => '6 mm',
                    'Warna' => '3000K Warm White',
                ],
                'conversions' => [
                    ['unit' => 'ROLL', 'factor' => 50],
                ],
            ],
            [
                'sku' => 'PSU-008',
                'name' => 'Power Supply Rainproof 12V 400W (33A)',
                'category' => 'Power Supply',
                'unit' => 'UNIT',
                'stock_qty' => 0,
                'min_stock' => 10,
                'avg_cost' => 185000,
                'is_active' => true,
                'specs' => [
                    'Output' => '12V 33A',
                    'Daya' => '400 Watt',
                    'Tipe' => 'Rainproof Outdoor',
                ],
                'conversions' => [
                    ['unit' => 'BOX', 'factor' => 10],
                ],
            ],
            [
                'sku' => 'PSU-012',
                'name' => 'Power Supply Slim Indoor 12V 200W',
                'category' => 'Power Supply',
                'unit' => 'UNIT',
                'stock_qty' => 14,
                'min_stock' => 8,
                'avg_cost' => 115000,
                'is_active' => true,
                'specs' => [
                    'Output' => '12V 16.5A',
                    'Daya' => '200 Watt',
                    'Tipe' => 'Slim Indoor',
                ],
                'conversions' => [],
            ],
            [
                'sku' => 'ALU-021',
                'name' => 'Hollow Aluminium 4x4 cm (6 Meter)',
                'category' => 'Rangka & Profil',
                'unit' => 'BTG',
                'stock_qty' => 64,
                'min_stock' => 20,
                'avg_cost' => 145000,
                'is_active' => true,
                'specs' => [
                    'Dimensi' => '40 x 40 mm',
                    'Panjang' => '6 Meter',
                    'Tebal' => '1.2 mm',
                ],
                'conversions' => [
                    ['unit' => 'PACK', 'factor' => 10],
                ],
            ],
            [
                'sku' => 'ALU-025',
                'name' => 'Profil Frame Neonbox Aluminium 13cm',
                'category' => 'Rangka & Profil',
                'unit' => 'BTG',
                'stock_qty' => 12,
                'min_stock' => 15,
                'avg_cost' => 210000,
                'is_active' => true,
                'specs' => [
                    'Lebar Profil' => '13 cm',
                    'Panjang' => '6 Meter',
                    'Finishing' => 'Silver Anodized',
                ],
                'conversions' => [],
            ],
            [
                'sku' => 'VNL-005',
                'name' => 'Stiker Vinyl Oracal 8500 Translucent',
                'category' => 'Finishing & Stiker',
                'unit' => 'MTR',
                'stock_qty' => 45,
                'min_stock' => 50,
                'avg_cost' => 78000,
                'is_active' => true,
                'specs' => [
                    'Lebar' => '126 cm',
                    'Tipe' => 'Translucent Backlit',
                    'Merek' => 'Oracal 8500',
                ],
                'conversions' => [
                    ['unit' => 'ROLL', 'factor' => 50],
                ],
            ],
            [
                'sku' => 'FST-003',
                'name' => 'Sekrup Roofing & Fisher Beton M8',
                'category' => 'Aksesoris & Fastener',
                'unit' => 'PCS',
                'stock_qty' => 1200,
                'min_stock' => 300,
                'avg_cost' => 650,
                'is_active' => true,
                'specs' => [
                    'Ukuran' => 'M8 x 50 mm',
                    'Material' => 'Baja Galvanis',
                ],
                'conversions' => [
                    ['unit' => 'BOX', 'factor' => 500],
                ],
            ],
            [
                'sku' => 'TLS-019',
                'name' => 'Lem Akrilik Chloroform 1 Liter (Arsip)',
                'category' => 'Peralatan & Mesin',
                'unit' => 'UNIT',
                'stock_qty' => 4,
                'min_stock' => 2,
                'avg_cost' => 65000,
                'is_active' => false,
                'specs' => [
                    'Kemasan' => 'Botol 1 Liter',
                ],
                'conversions' => [],
            ],
        ];

        foreach ($items as $entry) {
            $item = Item::query()->updateOrCreate(
                ['sku' => $entry['sku']],
                [
                    'name' => $entry['name'],
                    'category_id' => $categories[$entry['category']]->id,
                    'unit_id' => $units[$entry['unit']]->id,
                    'stock_qty' => $entry['stock_qty'],
                    'min_stock' => $entry['min_stock'],
                    'avg_cost' => $entry['avg_cost'],
                    'specs' => $entry['specs'],
                    'is_active' => $entry['is_active'],
                ],
            );

            $item->conversions()->delete();

            foreach ($entry['conversions'] as $conversion) {
                $item->conversions()->create([
                    'unit_id' => $units[$conversion['unit']]->id,
                    'factor' => $conversion['factor'],
                ]);
            }
        }
    }
}
