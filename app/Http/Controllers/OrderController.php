<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Get list of all orders with items and products (Admin).
     */
    public function index()
    {
        $orders = Order::with('items.product')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($orders);
    }

    /**
     * Place a new order (Customer Storefront).
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_address' => 'required|string',
            'courier' => 'required|string|in:Instant,Sameday,Ekspedisi',
            'delivery_date' => 'required|date|after_or_equal:today',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            $order = DB::transaction(function () use ($request) {
                $totalPrice = 0;
                $orderItemsToCreate = [];

                // 1. Process items and verify stock
                foreach ($request->items as $itemData) {
                    // Lock product for update to prevent race conditions
                    $product = Product::lockForUpdate()->find($itemData['product_id']);

                    if ($product->stock < $itemData['quantity']) {
                        throw new \Exception("Stok tidak mencukupi untuk kue: " . $product->name . " (Tersisa " . $product->stock . " pcs)");
                    }

                    // Reduce stock
                    $product->decrement('stock', $itemData['quantity']);

                    $itemPrice = $product->price;
                    $subTotal = $itemPrice * $itemData['quantity'];
                    $totalPrice += $subTotal;

                    $orderItemsToCreate[] = [
                        'product_id' => $product->id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemPrice
                    ];
                }

                // 2. Create the order
                $order = Order::create([
                    'customer_name' => $request->customer_name,
                    'customer_phone' => $request->customer_phone,
                    'customer_address' => $request->customer_address,
                    'courier' => $request->courier,
                    'delivery_date' => $request->delivery_date,
                    'total_price' => $totalPrice,
                    'status' => 'Pending',
                ]);

                // 3. Save order items
                foreach ($orderItemsToCreate as $itemToCreate) {
                    $itemToCreate['order_id'] = $order->id;
                    OrderItem::create($itemToCreate);
                }

                return $order;
            });

            return response()->json([
                'message' => 'Pesanan berhasil dibuat!',
                'order' => $order->load('items.product')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Update the status of an order (Admin).
     */
    public function updateStatus(Request $request, Order $order)
    {
        $request->validate([
            'status' => 'required|string|in:Pending,Kitchen Queue,Ready for Delivery,Completed'
        ]);

        $order->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Status pesanan berhasil diperbarui!',
            'order' => $order->load('items.product')
        ]);
    }
}
