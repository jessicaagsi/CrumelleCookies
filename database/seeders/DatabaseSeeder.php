<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\RawMaterial;
use App\Models\Expense;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Admin User
        User::factory()->create([
            'name' => 'Admin Crumelle',
            'email' => 'admin@crumelle.com',
            'password' => Hash::make('password'),
        ]);

        // 2. Seed Products
        $products = [
            [
                'name' => 'Cookie Monster',
                'price' => 38000,
                'category' => 'Premium Gourmet',
                'photo' => 'cookie_monster.jpg',
                'stock' => 15,
                'status' => 'Active',
                'description' => 'Soft-baked blue cookie adonan vanilla dengan perpaduan remahan Oreo renyah dan lelehan white chocolate chunks premium di dalamnya.',
                'weight' => 'Big Cookie (diameter 8cm, ±85g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Panaskan dalam microwave selama 10-15 detik untuk mendapatkan lelehan cokelat yang optimal.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu', 'Soya']),
            ],
            [
                'name' => 'Classic Choco',
                'price' => 28000,
                'category' => 'The Classics',
                'photo' => 'classic_choco.jpg',
                'stock' => 20,
                'status' => 'Active',
                'description' => 'Kue kering soft-baked klasik dengan mentega premium Prancis, dipadukan limpahan dark chocolate chunks 70% yang meleleh gurih di setiap gigitan.',
                'weight' => 'Big Cookie (diameter 8cm, ±80g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Nikmati langsung atau celupkan ke dalam segelas susu murni hangat.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu']),
            ],
            [
                'name' => 'Dark Chocolate',
                'price' => 33000,
                'category' => 'The Classics',
                'photo' => 'dark_chocolate.jpg',
                'stock' => 12,
                'status' => 'Active',
                'description' => 'Adonan cokelat pekat ganda (double chocolate) yang kaya rasa dengan taburan sea salt flakes di atasnya untuk menyeimbangkan rasa manis.',
                'weight' => 'Big Cookie (diameter 8cm, ±80g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Sangat cocok dinikmati bersama kopi hitam atau teh pahit.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu']),
            ],
            [
                'name' => 'Velvet Creme',
                'price' => 33000,
                'category' => 'Premium Gourmet',
                'photo' => 'velvet_creme.jpg',
                'stock' => 18,
                'status' => 'Active',
                'description' => 'Cookies Red Velvet merah merona yang lembut dengan isian cream cheese meleleh yang gurih, asam, manis berpadu sempurna.',
                'weight' => 'Big Cookie (diameter 8cm, ±85g)',
                'shelf_life' => 'Tahan 5 hari di suhu ruang, 10 hari di kulkas.',
                'serving_suggestion' => 'Sajikan dingin dari kulkas untuk tekstur cheese cake yang padat, atau hangatkan sebentar.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu', 'Cream Cheese']),
            ],
            [
                'name' => 'Matcha Cloud',
                'price' => 30000,
                'category' => 'Premium Gourmet',
                'photo' => 'matcha_cloud.jpg',
                'stock' => 8,
                'status' => 'Active',
                'description' => 'Biskuit lembut matcha menggunakan bubuk Uji Matcha autentik Jepang kelas premium, dipadukan white chocolate chunks manis lembut.',
                'weight' => 'Big Cookie (diameter 8cm, ±80g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Panaskan microwave 10 detik agar cokelat putih meleleh sempurna.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu']),
            ],
            [
                'name' => 'Almond Crunch',
                'price' => 30000,
                'category' => 'The Classics',
                'photo' => 'almond_crunch.jpg',
                'stock' => 10,
                'status' => 'Active',
                'description' => 'Perpaduan adonan mentega klasik dengan irisan almond panggang yang renyah di luar dan kelembutan cookies di dalam.',
                'weight' => 'Big Cookie (diameter 8cm, ±80g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Sangat nikmat disajikan sebagai teman camilan sore hari.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu', 'Kacang Almond']),
            ],
            [
                'name' => 'Lava Noir',
                'price' => 35000,
                'category' => 'Premium Gourmet',
                'photo' => 'lava_noir.jpg',
                'stock' => 5,
                'status' => 'Active',
                'description' => 'Cookies cokelat hitam dengan isian fudge cokelat belgian melimpah yang mengalir bagai lava ketika dibelah.',
                'weight' => 'Big Cookie (diameter 8cm, ±90g)',
                'shelf_life' => 'Tahan 5 hari di suhu ruang, 10 hari di kulkas.',
                'serving_suggestion' => 'Wajib di-microwave selama 10-15 detik untuk efek lava cokelat lumer maksimal!',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu']),
            ],
            [
                'name' => 'Rainbow Sprinkle',
                'price' => 27000,
                'category' => 'Seasonal',
                'photo' => 'rainbow_sprinkle.jpg',
                'stock' => 22,
                'status' => 'Active',
                'description' => 'Cookies edisi liburan yang ceria dengan adonan vanilla manis gurih bertabur butiran sprinkle warna-warni pelangi yang renyah.',
                'weight' => 'Big Cookie (diameter 8cm, ±80g)',
                'shelf_life' => 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
                'serving_suggestion' => 'Sangat disukai anak-anak, nikmat disandingkan dengan susu vanilla dingin.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu']),
            ],
            [
                'name' => 'Crumelle Red Velvet Cream Cheese',
                'price' => 28000,
                'category' => 'Premium Gourmet',
                'photo' => 'red_velvet_cheese.jpg',
                'stock' => 20,
                'status' => 'Active',
                'description' => 'Varian best-seller Red Velvet eksklusif Crumelle dengan adonan premium beraroma cokelat tipis, disisipi keju krim gurih meleleh.',
                'weight' => 'Big Cookie (diameter 8cm, ±85g)',
                'shelf_life' => 'Tahan 5 hari di suhu ruang, 10 hari di kulkas.',
                'serving_suggestion' => 'Sajikan hangat agar krim keju lumer, atau dingin untuk sensasi keju beku.',
                'ingredients' => json_encode(['Gluten', 'Telur', 'Susu', 'Cream Cheese']),
            ]
        ];

        foreach ($products as $prod) {
            Product::create($prod);
        }

        // 3. Seed Raw Materials
        $rawMaterials = [
            [
                'name' => 'Mentega Premium (Butter)',
                'stock' => 4.5,
                'unit' => 'kg',
                'low_stock_threshold' => 2.0,
            ],
            [
                'name' => 'Cokelat Chunks 70%',
                'stock' => 8.0,
                'unit' => 'kg',
                'low_stock_threshold' => 3.0,
            ],
            [
                'name' => 'Tepung Terigu Protein Sedang',
                'stock' => 12.5,
                'unit' => 'kg',
                'low_stock_threshold' => 5.0,
            ],
            [
                'name' => 'Telur Ayam Segar',
                'stock' => 15.0, // 15 eggs left
                'unit' => 'butir',
                'low_stock_threshold' => 30.0, // triggers Low Stock Alert (Yellow/Red)
            ],
            [
                'name' => 'Kemasan Box Crumelle (isi 6)',
                'stock' => 120.0,
                'unit' => 'pcs',
                'low_stock_threshold' => 50.0,
            ],
            [
                'name' => 'Bubuk Uji Matcha Jepang',
                'stock' => 0.4, // 400g left
                'unit' => 'kg',
                'low_stock_threshold' => 0.5, // triggers Low Stock Alert!
            ],
        ];

        foreach ($rawMaterials as $mat) {
            RawMaterial::create($mat);
        }

        // 4. Seed Expenses
        $expenses = [
            [
                'description' => 'Beli Mentega Premium Elle & Vire 5kg',
                'amount' => 650000,
                'category' => 'Bahan Baku',
                'date' => '2026-06-01',
            ],
            [
                'description' => 'Beli Kemasan Box Crumelle 200pcs',
                'amount' => 400000,
                'category' => 'Branding/Iklan',
                'date' => '2026-06-02',
            ],
            [
                'description' => 'Bayar Listrik & Internet Toko Juni',
                'amount' => 180000,
                'category' => 'Listrik/Internet',
                'date' => '2026-06-05',
            ],
            [
                'description' => 'Beli Cokelat Chunks Belgium 10kg',
                'amount' => 850000,
                'category' => 'Bahan Baku',
                'date' => '2026-06-08',
            ],
        ];

        foreach ($expenses as $exp) {
            Expense::create($exp);
        }

        // 5. Seed Orders and Items
        // Order 1: Pending (Current date)
        $order1 = Order::create([
            'customer_name' => 'Tina Yu',
            'customer_phone' => '08123456789',
            'customer_address' => 'Jl. Sudirman No. 12, Jakarta',
            'courier' => 'Instant',
            'delivery_date' => '2026-06-10',
            'total_price' => 66000,
            'status' => 'Pending',
        ]);
        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => 4, // Velvet Creme
            'quantity' => 2,
            'price' => 33000,
        ]);

        // Order 2: Kitchen Queue (PO)
        $order2 = Order::create([
            'customer_name' => 'Budi Santoso',
            'customer_phone' => '08987654321',
            'customer_address' => 'Gading Serpong Cluster Amber No. 5, Tangerang',
            'courier' => 'Sameday',
            'delivery_date' => '2026-06-20', // Future PO date
            'total_price' => 90000,
            'status' => 'Kitchen Queue',
        ]);
        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => 5, // Matcha Cloud
            'quantity' => 3,
            'price' => 30000,
        ]);

        // Order 3: Ready for Delivery
        $order3 = Order::create([
            'customer_name' => 'Clarissa',
            'customer_phone' => '0855223344',
            'customer_address' => 'Menteng Heights Apt Lt. 10, Jakarta Pusat',
            'courier' => 'Instant',
            'delivery_date' => '2026-06-10',
            'total_price' => 38000,
            'status' => 'Ready for Delivery',
        ]);
        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => 1, // Cookie Monster
            'quantity' => 1,
            'price' => 38000,
        ]);

        // Order 4: Completed (Past date)
        $order4 = Order::create([
            'customer_name' => 'Dewi Lestari',
            'customer_phone' => '0877112233',
            'customer_address' => 'Perumahan Rungkut Asri Block C-4, Surabaya',
            'courier' => 'Ekspedisi',
            'delivery_date' => '2026-06-09',
            'total_price' => 56000,
            'status' => 'Completed',
        ]);
        OrderItem::create([
            'order_id' => $order4->id,
            'product_id' => 2, // Classic Choco
            'quantity' => 2,
            'price' => 28000,
        ]);

        // Order 5: Completed (Past date)
        $order5 = Order::create([
            'customer_name' => 'Evan Tan',
            'customer_phone' => '0822119988',
            'customer_address' => 'Pakuwon Indah Townhouse A-8, Surabaya',
            'courier' => 'Instant',
            'delivery_date' => '2026-06-08',
            'total_price' => 84000,
            'status' => 'Completed',
        ]);
        OrderItem::create([
            'order_id' => $order5->id,
            'product_id' => 2, // Classic Choco
            'quantity' => 3,
            'price' => 28000,
        ]);
    }
}
