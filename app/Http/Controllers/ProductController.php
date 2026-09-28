<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class ProductController extends Controller
{
    /**
     * Get list of active products for storefront catalog.
     */
    public function getActiveProducts()
    {
        $products = Product::where('status', 'Active')->get();
        return response()->json($products);
    }

    /**
     * Get list of all products for admin dashboard.
     */
    public function index()
    {
        $products = Product::orderBy('created_at', 'desc')->get();
        return response()->json($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'category' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string|in:Active,Draft',
            'description' => 'nullable|string',
            'weight' => 'nullable|string|max:255',
            'shelf_life' => 'nullable|string|max:255',
            'serving_suggestion' => 'nullable|string|max:255',
            'ingredients' => 'nullable|array',
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $photoFilename = 'placeholder.jpg';
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $photoFilename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images'), $photoFilename);
        }

        $product = Product::create([
            'name' => $request->name,
            'price' => $request->price,
            'category' => $request->category,
            'stock' => $request->stock,
            'status' => $request->status,
            'description' => $request->description,
            'weight' => $request->weight,
            'shelf_life' => $request->shelf_life,
            'serving_suggestion' => $request->serving_suggestion,
            'ingredients' => $request->ingredients ? json_encode($request->ingredients) : null,
            'photo' => $photoFilename,
        ]);

        return response()->json([
            'message' => 'Produk berhasil ditambahkan!',
            'product' => $product
        ], 201);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'category' => 'required|string|max:255',
            'stock' => 'required|integer|min:0',
            'status' => 'required|string|in:Active,Draft',
            'description' => 'nullable|string',
            'weight' => 'nullable|string|max:255',
            'shelf_life' => 'nullable|string|max:255',
            'serving_suggestion' => 'nullable|string|max:255',
            'ingredients' => 'nullable|array',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $photoFilename = $product->photo;
        if ($request->hasFile('photo')) {
            // Delete old photo if it exists and isn't a seeded image
            $oldPath = public_path('images/' . $product->photo);
            $seedImages = [
                'cookie_monster.jpg', 'classic_choco.jpg', 'dark_chocolate.jpg',
                'velvet_creme.jpg', 'matcha_cloud.jpg', 'almond_crunch.jpg',
                'lava_noir.jpg', 'rainbow_sprinkle.jpg', 'red_velvet_cheese.jpg',
                'hero_banner.jpg', 'crumelle_logo.png'
            ];
            if (File::exists($oldPath) && !in_array($product->photo, $seedImages)) {
                File::delete($oldPath);
            }

            $file = $request->file('photo');
            $photoFilename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('images'), $photoFilename);
        }

        $product->update([
            'name' => $request->name,
            'price' => $request->price,
            'category' => $request->category,
            'stock' => $request->stock,
            'status' => $request->status,
            'description' => $request->description,
            'weight' => $request->weight,
            'shelf_life' => $request->shelf_life,
            'serving_suggestion' => $request->serving_suggestion,
            'ingredients' => $request->ingredients ? json_encode($request->ingredients) : null,
            'photo' => $photoFilename,
        ]);

        return response()->json([
            'message' => 'Produk berhasil diperbarui!',
            'product' => $product
        ]);
    }

    /**
     * Quick stock adjustment.
     */
    public function updateStock(Request $request, Product $product)
    {
        $request->validate([
            'stock' => 'required|integer|min:0'
        ]);

        $product->update([
            'stock' => $request->stock
        ]);

        return response()->json([
            'message' => 'Stok produk berhasil diperbarui!',
            'product' => $product
        ]);
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product)
    {
        // Delete photo if not a seed image
        $path = public_path('images/' . $product->photo);
        $seedImages = [
            'cookie_monster.jpg', 'classic_choco.jpg', 'dark_chocolate.jpg',
            'velvet_creme.jpg', 'matcha_cloud.jpg', 'almond_crunch.jpg',
            'lava_noir.jpg', 'rainbow_sprinkle.jpg', 'red_velvet_cheese.jpg',
            'hero_banner.jpg', 'crumelle_logo.png'
        ];
        if (File::exists($path) && !in_array($product->photo, $seedImages)) {
            File::delete($path);
        }

        $product->delete();

        return response()->json([
            'message' => 'Produk berhasil dihapus!'
        ]);
    }
}
