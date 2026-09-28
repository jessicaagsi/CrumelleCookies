import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    photo: string;
    stock: number;
    status: string;
    description: string;
    weight: string;
    shelf_life: string;
    serving_suggestion: string;
    ingredients: string;
}

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    product?: Product;
}

interface Order {
    id: number;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    courier: string;
    delivery_date: string;
    total_price: number;
    status: string;
    items: OrderItem[];
    created_at: string;
}

interface RawMaterial {
    id: number;
    name: string;
    stock: number;
    unit: string;
    low_stock_threshold: number;
}

interface Expense {
    id: number;
    description: string;
    amount: number;
    category: string;
    date: string;
}

interface Analytics {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    orders_count: number;
    pending_count: number;
    top_selling: { name: string; qty: number; percentage: number }[];
    monthly_trends: { label: string; revenue: number }[];
}

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<string>('analytics');

    // Data states
    const [analytics, setAnalytics] = useState<Analytics>({
        total_revenue: 0,
        total_expenses: 0,
        net_profit: 0,
        orders_count: 0,
        pending_count: 0,
        top_selling: [],
        monthly_trends: []
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [inventory, setInventory] = useState<RawMaterial[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    // Form states
    const [showProductModal, setShowProductModal] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [prodForm, setProdForm] = useState({
        name: '',
        price: '',
        category: 'Premium Gourmet',
        stock: '20',
        status: 'Active',
        description: '',
        weight: 'Big Cookie (diameter 8cm, ±85g)',
        shelf_life: 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
        serving_suggestion: 'Goreng mikro (microwave) selama 10 detik untuk sensasi lumer!',
        ingredients: ['Gluten', 'Telur', 'Susu']
    });
    const [prodPhoto, setProdPhoto] = useState<File | null>(null);

    // Expense Form state
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        category: 'Bahan Baku',
        date: new Date().toISOString().split('T')[0]
    });

    // Raw Material adjustment state
    const [adjustMaterial, setAdjustMaterial] = useState<{ id: number; stock: string } | null>(null);

    // Audio context for sound alerts
    const [lastPendingCount, setLastPendingCount] = useState<number>(0);

    // 1. Polling for real-time admin sync
    const fetchAdminData = async () => {
        try {
            const [analyticsRes, ordersRes, productsRes, inventoryRes, expensesRes] = await Promise.all([
                axios.get('/api/admin/analytics'),
                axios.get('/api/admin/orders'),
                axios.get('/api/admin/products'),
                axios.get('/api/admin/inventory'),
                axios.get('/api/admin/expenses')
            ]);

            setAnalytics(analyticsRes.data);
            setOrders(ordersRes.data);
            setProducts(productsRes.data);
            setInventory(inventoryRes.data);
            setExpenses(expensesRes.data);

            // Play sound alert if pending orders count increased (new order placed!)
            const newPendingCount = analyticsRes.data.pending_count;
            if (newPendingCount > lastPendingCount && lastPendingCount !== 0) {
                playOrderAlert();
            }
            setLastPendingCount(newPendingCount);

        } catch (error) {
            console.error('Error polling admin dashboard metrics', error);
        }
    };

    useEffect(() => {
        fetchAdminData();
        const interval = setInterval(fetchAdminData, 3000);
        return () => clearInterval(interval);
    }, [lastPendingCount]);

    // Notification alert sound generator
    const playOrderAlert = () => {
        try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, context.currentTime); // C5 note
            osc.frequency.setValueAtTime(659.25, context.currentTime + 0.15); // E5 note
            osc.frequency.setValueAtTime(783.99, context.currentTime + 0.3); // G5 note
            
            gain.gain.setValueAtTime(0.3, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
            
            osc.start();
            osc.stop(context.currentTime + 0.5);
        } catch (e) {
            console.error('Audio alert not supported or blocked by browser gesture.');
        }
    };

    // Helper currency formatter
    const formatIDR = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val).replace('IDR', 'Rp');
    };

    // Kanban order promoter
    const promoteOrder = async (orderId: number, currentStatus: string) => {
        let nextStatus = '';
        if (currentStatus === 'Pending') nextStatus = 'Kitchen Queue';
        else if (currentStatus === 'Kitchen Queue') nextStatus = 'Ready for Delivery';
        else if (currentStatus === 'Ready for Delivery') nextStatus = 'Completed';
        
        if (!nextStatus) return;

        try {
            await axios.post(`/api/admin/orders/${orderId}/status`, { status: nextStatus });
            fetchAdminData();
        } catch (error) {
            alert('Gagal memperbarui status pesanan.');
        }
    };

    // Product CRUD handlers
    const openAddProduct = () => {
        setEditingProduct(null);
        setProdForm({
            name: '',
            price: '',
            category: 'Premium Gourmet',
            stock: '20',
            status: 'Active',
            description: '',
            weight: 'Big Cookie (diameter 8cm, ±85g)',
            shelf_life: 'Tahan 7 hari di suhu ruang, 14 hari di kulkas.',
            serving_suggestion: 'Goreng mikro (microwave) selama 10 detik untuk sensasi lumer!',
            ingredients: ['Gluten', 'Telur', 'Susu']
        });
        setProdPhoto(null);
        setShowProductModal(true);
    };

    const openEditProduct = (product: Product) => {
        setEditingProduct(product);
        let ingredArray = ['Gluten', 'Telur', 'Susu'];
        try {
            ingredArray = JSON.parse(product.ingredients);
        } catch(e) {
            if (product.ingredients) {
                ingredArray = product.ingredients.split(',').map(s => s.trim());
            }
        }

        setProdForm({
            name: product.name,
            price: String(product.price),
            category: product.category,
            stock: String(product.stock),
            status: product.status,
            description: product.description || '',
            weight: product.weight || '',
            shelf_life: product.shelf_life || '',
            serving_suggestion: product.serving_suggestion || '',
            ingredients: ingredArray
        });
        setProdPhoto(null);
        setShowProductModal(true);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('name', prodForm.name);
        data.append('price', prodForm.price);
        data.append('category', prodForm.category);
        data.append('stock', prodForm.stock);
        data.append('status', prodForm.status);
        data.append('description', prodForm.description);
        data.append('weight', prodForm.weight);
        data.append('shelf_life', prodForm.shelf_life);
        data.append('serving_suggestion', prodForm.serving_suggestion);
        
        prodForm.ingredients.forEach((ing, i) => {
            data.append(`ingredients[${i}]`, ing);
        });

        if (prodPhoto) {
            data.append('photo', prodPhoto);
        }

        try {
            if (editingProduct) {
                // PHP does not easily parse form-data in PUT/PATCH requests. Using POST to update is standard.
                await axios.post(`/api/admin/products/${editingProduct.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post('/api/admin/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowProductModal(false);
            fetchAdminData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal menyimpan produk. Periksa kembali form isian.');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus produk ini secara permanen?')) return;
        try {
            await axios.delete(`/api/admin/products/${id}`);
            fetchAdminData();
        } catch (error) {
            alert('Gagal menghapus produk.');
        }
    };

    // Quick stock edit
    const updateProductStockDirect = async (id: number, val: number) => {
        try {
            await axios.post(`/api/admin/products/${id}/stock`, { stock: val });
            fetchAdminData();
        } catch (error) {
            alert('Gagal memperbarui stok.');
        }
    };

    // Material update
    const handleMaterialUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustMaterial) return;
        try {
            await axios.post(`/api/admin/inventory/${adjustMaterial.id}`, { stock: parseFloat(adjustMaterial.stock) });
            setAdjustMaterial(null);
            fetchAdminData();
        } catch (error) {
            alert('Gagal menyimpan perubahan.');
        }
    };

    // Expense submit
    const handleExpenseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.description || !expenseForm.amount) return;
        try {
            await axios.post('/api/admin/expenses', {
                description: expenseForm.description,
                amount: parseInt(expenseForm.amount),
                category: expenseForm.category,
                date: expenseForm.date
            });
            setExpenseForm({
                description: '',
                amount: '',
                category: 'Bahan Baku',
                date: new Date().toISOString().split('T')[0]
            });
            fetchAdminData();
        } catch (error) {
            alert('Gagal menyimpan pengeluaran.');
        }
    };

    // Check pre-order statuses
    const isPreOrder = (deliveryDateStr: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        return deliveryDateStr > todayStr;
    };

    // Material safety alerts
    const getMaterialStatusClass = (mat: RawMaterial) => {
        if (mat.stock <= mat.low_stock_threshold) return 'danger';
        if (mat.stock <= mat.low_stock_threshold * 1.5) return 'warning';
        return 'success';
    };

    const getMaterialStatusLabel = (mat: RawMaterial) => {
        if (mat.stock <= mat.low_stock_threshold) return 'BELI SEGERA';
        if (mat.stock <= mat.low_stock_threshold * 1.5) return 'PEMANTAUAN';
        return 'AMAN';
    };

    // Separate orders into columns
    const columns = {
        'Pending': orders.filter(o => o.status === 'Pending'),
        'Kitchen Queue': orders.filter(o => o.status === 'Kitchen Queue'),
        'Ready for Delivery': orders.filter(o => o.status === 'Ready for Delivery'),
        'Completed': orders.filter(o => o.status === 'Completed'),
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-2xl font-bold leading-tight text-[#3E2723] serif-font">
                        Dapur Belakang - Crumelle Cookies
                    </h2>
                    <span className="text-xs md:text-sm font-semibold bg-[#FAF0E4] px-4 py-2 rounded-full border border-[#7A5C43]/20 text-[#7A5C43]">
                        Status Toko: <strong>Real-time Synchronized</strong>
                    </span>
                </div>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Horizontal Navigation Tabs */}
                <div className="flex border-b border-[#F4EBE1] mb-8 bg-white p-2 rounded-xl shadow-sm overflow-x-auto gap-2">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'analytics' 
                            ? 'bg-[#7A5C43] text-white shadow-sm' 
                            : 'text-[#7A5C43] hover:bg-[#FCF8F4]'
                        }`}
                    >
                        📊 Ringkasan Keuangan
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider rounded-lg transition-all relative ${
                            activeTab === 'orders' 
                            ? 'bg-[#7A5C43] text-white shadow-sm' 
                            : 'text-[#7A5C43] hover:bg-[#FCF8F4]'
                        }`}
                    >
                        🧑‍🍳 Pesanan Masuk
                        {analytics.pending_count > 0 && (
                            <span className="ml-2 bg-[#D62828] text-white text-[10px] font-bold rounded-full px-2 py-0.5 border border-white">
                                {analytics.pending_count} PO
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'inventory' 
                            ? 'bg-[#7A5C43] text-white shadow-sm' 
                            : 'text-[#7A5C43] hover:bg-[#FCF8F4]'
                        }`}
                    >
                        📦 Stok & Bahan Baku
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-3 px-6 text-sm font-bold uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'products' 
                            ? 'bg-[#7A5C43] text-white shadow-sm' 
                            : 'text-[#7A5C43] hover:bg-[#FCF8F4]'
                        }`}
                    >
                        🍪 Atur Katalog
                    </button>
                </div>

                {/* 1. ANALYTICS TAB */}
                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        {/* Financial Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="kpi-card border-l-8 border-[#2A9D8F]">
                                <p className="text-xs font-bold text-[#7A5C43] uppercase tracking-wider">Omset (Revenue)</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-[#3E2723] mt-2">{formatIDR(analytics.total_revenue)}</h3>
                                <p className="text-xs text-[#7A5C43]/70 mt-1">Total pembayaran pesanan selesai</p>
                            </div>
                            <div className="kpi-card border-l-8 border-[#D62828]">
                                <p className="text-xs font-bold text-[#7A5C43] uppercase tracking-wider">Pengeluaran (Expenses)</p>
                                <h3 className="text-2xl md:text-3xl font-bold text-[#3E2723] mt-2">{formatIDR(analytics.total_expenses)}</h3>
                                <p className="text-xs text-[#7A5C43]/70 mt-1">Belanja bahan, branding & listrik</p>
                            </div>
                            <div className={`kpi-card border-l-8 ${analytics.net_profit >= 0 ? 'border-[#C99738]' : 'border-[#D62828]'}`}>
                                <p className="text-xs font-bold text-[#7A5C43] uppercase tracking-wider">Laba Bersih (Net Profit)</p>
                                <h3 className={`text-2xl md:text-3xl font-bold mt-2 ${analytics.net_profit >= 0 ? 'text-[#2A9D8F]' : 'text-[#D62828]'}`}>
                                    {formatIDR(analytics.net_profit)}
                                </h3>
                                <p className="text-xs text-[#7A5C43]/70 mt-1">Selisih total omset dan biaya operasional</p>
                            </div>
                        </div>

                        {/* Top Selling & Sales Trends Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Top Selling Products List */}
                            <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                                <h3 className="text-lg font-bold text-[#3E2723] mb-4">Statistik Penjualan Kue</h3>
                                <div className="space-y-4">
                                    {analytics.top_selling.length === 0 ? (
                                        <p className="text-sm text-[#7A5C43] italic text-center py-8">Belum ada data penjualan.</p>
                                    ) : (
                                        analytics.top_selling.map((item, idx) => {
                                            const colors = ['bg-[#7A5C43]', 'bg-[#DDA15E]', 'bg-[#C99738]', 'bg-[#3E2723]'];
                                            const colorClass = colors[idx % colors.length];
                                            return (
                                                <div key={idx} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-semibold text-[#3E2723]">{item.name}</span>
                                                        <span className="text-[#7A5C43] font-bold">{item.qty} pcs ({item.percentage}%)</span>
                                                    </div>
                                                    <div className="w-full bg-[#FAF0E4] h-3.5 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`${colorClass} h-full rounded-full`} 
                                                            style={{ width: `${item.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Monthly Sales Performance (Simple SVG Graph) */}
                            <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                                <h3 className="text-lg font-bold text-[#3E2723] mb-4">Tren Pendapatan Bulanan</h3>
                                <div className="flex items-end justify-between h-48 pt-6 border-b border-[#F4EBE1] pb-1">
                                    {analytics.monthly_trends.map((m, idx) => {
                                        // Find max revenue for scale
                                        const maxRev = Math.max(...analytics.monthly_trends.map(x => x.revenue), 100000);
                                        const heightPercent = Math.max(10, Math.min(100, (m.revenue / maxRev) * 100));
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                                <div className="text-[10px] font-bold text-[#7A5C43]">{formatIDR(m.revenue)}</div>
                                                <div 
                                                    className="w-10 sm:w-16 bg-[#DDA15E] rounded-t-lg hover:bg-[#7A5C43] transition-colors"
                                                    style={{ height: `${heightPercent * 0.7}%` }}
                                                />
                                                <div className="text-xs text-[#3E2723] font-medium">{m.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Expense Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Expense Logging Form */}
                            <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                                <h3 className="text-lg font-bold text-[#3E2723] mb-4">Catat Pengeluaran Baru</h3>
                                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Nama Pengeluaran</label>
                                        <input 
                                            type="text"
                                            value={expenseForm.description}
                                            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                                            placeholder="Beli Butter Premium, bayar iklan..."
                                            className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Jumlah Biaya (Rp)</label>
                                        <input 
                                            type="number"
                                            value={expenseForm.amount}
                                            onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                                            placeholder="Contoh: 150000"
                                            className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Kategori</label>
                                        <select
                                            value={expenseForm.category}
                                            onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                                            className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                        >
                                            <option value="Bahan Baku">Bahan Baku</option>
                                            <option value="Operasional">Operasional</option>
                                            <option value="Listrik/Internet">Listrik & Internet</option>
                                            <option value="Branding/Iklan">Branding & Iklan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Tanggal</label>
                                        <input 
                                            type="date"
                                            value={expenseForm.date}
                                            onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                                            className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="w-full btn-primary py-2.5 text-sm uppercase tracking-wider font-bold">
                                        Simpan Transaksi
                                    </button>
                                </form>
                            </div>

                            {/* Expense List Table */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[#3E2723] mb-4">Catatan Operasional & Pengeluaran</h3>
                                    <div className="overflow-x-auto max-h-[300px]">
                                        <table className="w-full text-left text-sm border-collapse">
                                            <thead>
                                                <tr className="border-b border-[#F4EBE1] text-[#7A5C43] font-bold text-xs uppercase">
                                                    <th className="pb-3">Tanggal</th>
                                                    <th className="pb-3">Kategori</th>
                                                    <th className="pb-3">Keterangan</th>
                                                    <th className="pb-3 text-right">Biaya</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F4EBE1] text-xs">
                                                {expenses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-4 text-center text-[#7A5C43] italic">Belum ada pengeluaran dicatat.</td>
                                                    </tr>
                                                ) : (
                                                    expenses.map((e) => (
                                                        <tr key={e.id} className="text-[#3E2723] hover:bg-[#FCF8F4]/50">
                                                            <td className="py-3 font-medium">{e.date}</td>
                                                            <td className="py-3">
                                                                <span className="bg-[#FAF0E4] text-[#7A5C43] px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-[#7A5C43]/10">
                                                                    {e.category}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 font-medium">{e.description}</td>
                                                            <td className="py-3 text-right font-bold text-[#D62828]">{formatIDR(e.amount)}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ORDER MANAGEMENT TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-[#3E2723]">Alur Proses Kue (Kanban Board)</h3>
                            <span className="text-xs text-[#7A5C43] font-semibold flex items-center gap-1.5">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#E5A93B]"></span>
                                Warna kuning menandakan pesanan Pre-Order (PO) untuk masa mendatang.
                            </span>
                        </div>

                        <div className="kanban-board">
                            {Object.entries(columns).map(([colName, colOrders]) => {
                                const headers: any = {
                                    'Pending': { title: 'Belum Bayar (Pending)', color: 'text-[#8D6E63]' },
                                    'Kitchen Queue': { title: 'Antrean Dapur (Baking)', color: 'text-[#C99738]' },
                                    'Ready for Delivery': { title: 'Siap Kirim', color: 'text-[#2E7D32]' },
                                    'Completed': { title: 'Selesai', color: 'text-[#2A9D8F]' },
                                };
                                return (
                                    <div key={colName} className="kanban-column">
                                        <div className="flex justify-between items-center mb-4 border-b border-[#7A5C43]/10 pb-2">
                                            <h4 className={`font-bold text-sm ${headers[colName].color}`}>{headers[colName].title}</h4>
                                            <span className="bg-[#7A5C43]/10 text-[#7A5C43] font-bold text-[10px] px-2 py-0.5 rounded-full">
                                                {colOrders.length}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[350px]">
                                            {colOrders.length === 0 ? (
                                                <div className="h-full flex items-center justify-center text-center py-12 text-[#7A5C43]/40 text-xs italic">
                                                    Kosong
                                                </div>
                                            ) : (
                                                colOrders.map((order) => {
                                                    const isPO = isPreOrder(order.delivery_date);
                                                    return (
                                                        <div 
                                                            key={order.id} 
                                                            className={`kanban-card ${isPO ? 'po-highlight' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-bold text-xs text-[#3E2723]">#{order.id} - {order.customer_name}</span>
                                                                {isPO && (
                                                                    <span className="bg-[#E5A93B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                                                                        📅 PO
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-medium text-[#7A5C43] mt-1">HP: {order.customer_phone}</p>
                                                            <p className="text-[10px] text-[#7A5C43] line-clamp-1">Kirim: {order.customer_address}</p>
                                                            <p className="text-[10px] text-[#7A5C43]">Kurir: <strong>{order.courier}</strong></p>
                                                            <p className="text-[10px] text-[#7A5C43] mt-1 border-t border-[#F4EBE1] pt-1">
                                                                Tanggal Kirim: <strong>{order.delivery_date}</strong>
                                                            </p>

                                                            {/* Items list */}
                                                            <div className="my-2 p-1.5 bg-[#FCF8F4] rounded border border-[#F4EBE1] text-[10px] text-[#7A5C43] space-y-1">
                                                                {order.items.map((it) => (
                                                                    <div key={it.id} className="flex justify-between font-medium">
                                                                        <span>{it.quantity}x {it.product ? it.product.name : 'Produk'}</span>
                                                                        <span>{formatIDR(it.price * it.quantity)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#F4EBE1]">
                                                                <span className="font-bold text-xs text-[#BC6C25]">{formatIDR(order.total_price)}</span>
                                                                
                                                                {order.status !== 'Completed' && (
                                                                    <button
                                                                        onClick={() => promoteOrder(order.id, order.status)}
                                                                        className="bg-[#7A5C43]/10 text-[#7A5C43] hover:bg-[#7A5C43] hover:text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                                                    >
                                                                        Proses ➔
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. INVENTORY TAB */}
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Ready-to-eat products stock */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                            <h3 className="text-lg font-bold text-[#3E2723] mb-4">Stok Cookies Siap Saji (Ready-to-Eat)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#F4EBE1] text-[#7A5C43] font-bold text-xs uppercase">
                                            <th className="pb-3">Kue</th>
                                            <th className="pb-3">Kategori</th>
                                            <th className="pb-3">Status</th>
                                            <th className="pb-3">Stok Saat Ini</th>
                                            <th className="pb-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F4EBE1] text-xs">
                                        {products.map((prod) => {
                                            const statusClass = prod.stock === 0 ? 'danger' : prod.stock <= 5 ? 'warning' : 'success';
                                            const statusLabel = prod.stock === 0 ? 'HABIS' : prod.stock <= 5 ? 'MENIPIS' : 'READY';
                                            return (
                                                <tr key={prod.id} className="text-[#3E2723] hover:bg-[#FCF8F4]/50">
                                                    <td className="py-3 font-semibold flex items-center gap-2">
                                                        <img 
                                                            src={`/images/${prod.photo}`} 
                                                            alt={prod.name} 
                                                            className="w-10 h-10 object-cover rounded-lg border border-[#F4EBE1]"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/images/classic_choco.jpg';
                                                            }}
                                                        />
                                                        {prod.name}
                                                    </td>
                                                    <td className="py-3 text-[#7A5C43]">{prod.category}</td>
                                                    <td className="py-3">
                                                        <span className={`inventory-pill ${statusClass}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 font-bold text-sm">{prod.stock} pcs</td>
                                                    <td className="py-3 text-right">
                                                        <div className="inline-flex gap-1.5">
                                                            <button 
                                                                onClick={() => updateProductStockDirect(prod.id, prod.stock + 5)}
                                                                className="bg-[#FAF0E4] hover:bg-[#7A5C43] hover:text-white px-2.5 py-1.5 rounded font-bold transition-all text-[#7A5C43]"
                                                            >
                                                                +5 pcs
                                                            </button>
                                                            <button 
                                                                onClick={() => updateProductStockDirect(prod.id, prod.stock + 10)}
                                                                className="bg-[#FAF0E4] hover:bg-[#7A5C43] hover:text-white px-2.5 py-1.5 rounded font-bold transition-all text-[#7A5C43]"
                                                            >
                                                                +10 pcs
                                                            </button>
                                                            <button 
                                                                onClick={() => updateProductStockDirect(prod.id, 0)}
                                                                className="bg-red-50 hover:bg-[#D62828] hover:text-white px-2.5 py-1.5 rounded font-bold transition-all text-[#D62828]"
                                                            >
                                                                Habis
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Raw materials monitoring */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                                <h3 className="text-lg font-bold text-[#3E2723] mb-4">Stok Bahan Baku Utama</h3>
                                <div className="space-y-4">
                                    {inventory.map((mat) => {
                                        const statusColor = getMaterialStatusClass(mat);
                                        const statusText = getMaterialStatusLabel(mat);
                                        return (
                                            <div 
                                                key={mat.id} 
                                                className="p-3 bg-[#FCF8F4] border border-[#F4EBE1] rounded-xl flex justify-between items-center cursor-pointer hover:border-[#7A5C43]/30 transition-colors"
                                                onClick={() => setAdjustMaterial({ id: mat.id, stock: String(mat.stock) })}
                                            >
                                                <div>
                                                    <h4 className="font-bold text-sm text-[#3E2723]">{mat.name}</h4>
                                                    <p className="text-xs text-[#7A5C43]/70 mt-0.5">Min Threshold: {mat.low_stock_threshold} {mat.unit}</p>
                                                    <span className={`inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                        statusColor === 'danger' ? 'bg-[#FFECEC] text-[#D62828]' : 
                                                        statusColor === 'warning' ? 'bg-[#FFF8E1] text-[#E5A93B]' : 'bg-[#E8F5E9] text-[#2A9D8F]'
                                                    }`}>
                                                        {statusText}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block font-bold text-[#3E2723] text-lg">{mat.stock} {mat.unit}</span>
                                                    <span className="text-[10px] text-[#7A5C43] hover:underline">Edit Stok</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Raw material adjuster modal dialog */}
                            {adjustMaterial && (
                                <div className="p-4 bg-[#FFFFFF] border border-[#F4EBE1] rounded-xl shadow-md space-y-3">
                                    <h4 className="font-bold text-sm text-[#3E2723]">Update Stok Bahan Baku</h4>
                                    <form onSubmit={handleMaterialUpdate} className="flex gap-2">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            value={adjustMaterial.stock}
                                            onChange={(e) => setAdjustMaterial({ ...adjustMaterial, stock: e.target.value })}
                                            className="flex-1 text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                            required
                                        />
                                        <button type="submit" className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg">
                                            Simpan
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setAdjustMaterial(null)}
                                            className="btn-secondary py-2 px-4 text-xs font-semibold rounded-lg"
                                        >
                                            Batal
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4. PRODUCT CONTROL (CATALOG CRUD) TAB */}
                {activeTab === 'products' && (
                    <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-[#3E2723]">Daftar Menu & Katalog</h3>
                            <button 
                                onClick={openAddProduct}
                                className="btn-primary py-2 px-6 text-sm font-semibold rounded-xl flex items-center gap-1.5"
                            >
                                ➕ Tambah Kue Baru
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-[#F4EBE1] text-[#7A5C43] font-bold text-xs uppercase">
                                        <th className="pb-3">Nama Cookies</th>
                                        <th className="pb-3">Kategori</th>
                                        <th className="pb-3">Harga</th>
                                        <th className="pb-3">Stok</th>
                                        <th className="pb-3">Status Tampil</th>
                                        <th className="pb-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F4EBE1] text-xs">
                                    {products.map((prod) => (
                                        <tr key={prod.id} className="text-[#3E2723] hover:bg-[#FCF8F4]/50">
                                            <td className="py-3 font-semibold flex items-center gap-2">
                                                <img 
                                                    src={`/images/${prod.photo}`} 
                                                    alt={prod.name} 
                                                    className="w-10 h-10 object-cover rounded-lg border border-[#F4EBE1]"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/classic_choco.jpg';
                                                    }}
                                                />
                                                {prod.name}
                                            </td>
                                            <td className="py-3 text-[#7A5C43]">{prod.category}</td>
                                            <td className="py-3 font-bold text-[#BC6C25]">{formatIDR(prod.price)}</td>
                                            <td className="py-3 font-medium">{prod.stock} pcs</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    prod.status === 'Active' ? 'bg-[#E8F5E9] text-[#2A9D8F]' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {prod.status === 'Active' ? 'Aktif' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="inline-flex gap-2">
                                                    <button 
                                                        onClick={() => openEditProduct(prod)}
                                                        className="text-[#7A5C43] hover:text-[#3E2723] font-bold hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <span className="text-gray-300">|</span>
                                                    <button 
                                                        onClick={() => handleDeleteProduct(prod.id)}
                                                        className="text-[#D62828] hover:text-[#b82222] font-bold hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* PRODUCT ADD/EDIT MODAL FORM */}
            {showProductModal && (
                <div className="premium-modal-backdrop" onClick={() => setShowProductModal(false)}>
                    <div className="premium-modal max-w-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-[#F4EBE1] flex justify-between items-center">
                            <h3 className="text-xl font-bold text-[#3E2723]">
                                {editingProduct ? 'Ubah Informasi Kue' : 'Tambah Produk Kue Baru'}
                            </h3>
                            <button 
                                onClick={() => setShowProductModal(false)}
                                className="text-[#7A5C43] hover:text-[#3E2723]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Nama Produk Kue</label>
                                <input 
                                    type="text"
                                    value={prodForm.name}
                                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                                    placeholder="Contoh: Crumelle Red Velvet Cream Cheese"
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Harga (Rp)</label>
                                    <input 
                                        type="number"
                                        value={prodForm.price}
                                        onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                                        placeholder="Contoh: 28000"
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Kategori</label>
                                    <select
                                        value={prodForm.category}
                                        onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    >
                                        <option value="The Classics">The Classics</option>
                                        <option value="Premium Gourmet">Premium Gourmet</option>
                                        <option value="Seasonal">Seasonal</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Stok Awal</label>
                                    <input 
                                        type="number"
                                        value={prodForm.stock}
                                        onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Status Publikasi</label>
                                    <select
                                        value={prodForm.status}
                                        onChange={(e) => setProdForm({ ...prodForm, status: e.target.value })}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    >
                                        <option value="Active">Aktif / Tampilkan</option>
                                        <option value="Draft">Draft / Sembunyikan</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Deskripsi Sensori (Copywriting)</label>
                                <textarea 
                                    value={prodForm.description}
                                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                                    placeholder="Gambarkan cita rasa kue (cth: soft-baked dengan perpaduan mentega Prancis...)"
                                    rows={3}
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Ukuran & Berat</label>
                                <input 
                                    type="text"
                                    value={prodForm.weight}
                                    onChange={(e) => setProdForm({ ...prodForm, weight: e.target.value })}
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Daya Tahan Simpan</label>
                                    <input 
                                        type="text"
                                        value={prodForm.shelf_life}
                                        onChange={(e) => setProdForm({ ...prodForm, shelf_life: e.target.value })}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Saran Penyajian</label>
                                    <input 
                                        type="text"
                                        value={prodForm.serving_suggestion}
                                        onChange={(e) => setProdForm({ ...prodForm, serving_suggestion: e.target.value })}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] bg-[#FCF8F4]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Foto Kue (Unggah File)</label>
                                <input 
                                    type="file"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            setProdPhoto(e.target.files[0]);
                                        }
                                    }}
                                    className="w-full text-xs text-[#7A5C43] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FAF0E4] file:text-[#7A5C43] hover:file:bg-[#7A5C43] hover:file:text-white"
                                    required={!editingProduct}
                                />
                                <p className="text-[10px] text-[#7A5C43]/70 mt-1">Format: JPG, JPEG, PNG, WEBP (Max 2MB)</p>
                            </div>

                            <div className="pt-6 border-t border-[#F4EBE1] flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowProductModal(false)}
                                    className="btn-secondary py-2 px-6"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    className="btn-primary py-2 px-6 font-bold"
                                >
                                    Simpan & Tampilkan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
