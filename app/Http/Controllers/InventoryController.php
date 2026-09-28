<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    /**
     * Get all raw materials (Admin).
     */
    public function index()
    {
        $materials = RawMaterial::orderBy('name', 'asc')->get();
        return response()->json($materials);
    }

    /**
     * Replenish or adjust raw material stock.
     */
    public function update(Request $request, RawMaterial $rawMaterial)
    {
        $request->validate([
            'stock' => 'required|numeric|min:0'
        ]);

        $rawMaterial->update([
            'stock' => $request->stock
        ]);

        return response()->json([
            'message' => 'Stok bahan baku berhasil diperbarui!',
            'material' => $rawMaterial
        ]);
    }

    /**
     * Add a new raw material to inventory list.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:raw_materials,name',
            'stock' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'low_stock_threshold' => 'required|numeric|min:0',
        ]);

        $material = RawMaterial::create([
            'name' => $request->name,
            'stock' => $request->stock,
            'unit' => $request->unit,
            'low_stock_threshold' => $request->low_stock_threshold,
        ]);

        return response()->json([
            'message' => 'Bahan baku berhasil ditambahkan!',
            'material' => $material
        ], 201);
    }
}
