import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
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
    ingredients: string; // JSON string of allergens
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function Storefront() {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [detailQty, setDetailQty] = useState<number>(1);

    // Order form state
    const [name, setName] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [courier, setCourier] = useState<string>('Instant');
    const [deliveryDate, setDeliveryDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    // Success state
    const [successOrder, setSuccessOrder] = useState<any>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // 1. Polling for real-time stock changes
    const fetchProducts = async () => {
        try {
            const response = await axios.get('/api/storefront/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Error fetching storefront products', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        const interval = setInterval(fetchProducts, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    // Helper to format IDR
    const formatIDR = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price).replace('IDR', 'Rp');
    };

    // Filter categories
    const categories = ['All', 'The Classics', 'Premium Gourmet', 'Seasonal'];
    const filteredProducts = selectedCategory === 'All' 
        ? products 
        : products.filter(p => p.category === selectedCategory);

    // Cart Handlers
    const addToCart = (product: Product, quantity = 1) => {
        if (product.stock === 0) return;

        setCart(prevCart => {
            const existing = prevCart.find(item => item.product.id === product.id);
            const currentQtyInCart = existing ? existing.quantity : 0;
            const newQty = Math.min(product.stock, currentQtyInCart + quantity);

            if (existing) {
                return prevCart.map(item => 
                    item.product.id === product.id 
                        ? { ...item, quantity: newQty } 
                        : item
                );
            } else {
                return [...prevCart, { product, quantity: newQty }];
            }
        });

        // Feedback
        setIsCartOpen(true);
    };

    const updateCartQty = (productId: number, quantity: number) => {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        setCart(prevCart => {
            if (quantity <= 0) {
                return prevCart.filter(item => item.product.id !== productId);
            }
            const cleanQty = Math.min(prod.stock, quantity);
            return prevCart.map(item => 
                item.product.id === productId 
                    ? { ...item, quantity: cleanQty } 
                    : item
            );
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    };

    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const getCartItemCount = () => {
        return cart.reduce((count, item) => count + item.quantity, 0);
    };

    // Form submit to SQLite + WhatsApp Template
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        if (!name || !phone || !address || !deliveryDate) {
            setCheckoutError('Harap lengkapi semua kolom formulir.');
            return;
        }

        setCheckoutError(null);
        setIsSubmitting(true);

        const orderData = {
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            courier,
            delivery_date: deliveryDate,
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.quantity
            }))
        };

        try {
            const response = await axios.post('/api/storefront/orders', orderData);
            
            // Success
            setSuccessOrder(response.data.order);
            setCart([]); // clear cart
            setIsCartOpen(false);
            
            // Reset form
            setName('');
            setPhone('');
            setAddress('');
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.error) {
                setCheckoutError(error.response.data.error);
            } else {
                setCheckoutError('Gagal memproses pesanan. Silakan coba lagi.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getWhatsAppUrl = (order: any) => {
        if (!order) return '';
        
        let orderDetailsText = '';
        order.items.forEach((item: any, idx: number) => {
            orderDetailsText += `- ${item.quantity}x ${item.product.name} (${formatIDR(item.price * item.quantity)})\n`;
        });

        const text = `Halo Admin Crumelle! Saya ingin mengonfirmasi pesanan saya:\n\n` +
            `*ORDER ID:* #${order.id}\n` +
            `*Nama:* ${order.customer_name}\n` +
            `*No HP:* ${order.customer_phone}\n` +
            `*Alamat:* ${order.customer_address}\n` +
            `*Kurir:* ${order.courier}\n` +
            `*Tanggal Kirim (PO):* ${order.delivery_date}\n\n` +
            `*Pesanan:*\n${orderDetailsText}\n` +
            `*Total Pembayaran:* ${formatIDR(order.total_price)}\n\n` +
            `Terima kasih!`;

        return `https://wa.me/628123456789?text=${encodeURIComponent(text)}`;
    };

    return (
        <div className="min-h-screen bg-[#FCF8F4]">
            <Head title="Crumelle Cookies - Premium Soft-Baked Cookies" />

            {/* Header / Navbar */}
            <nav className="crumelle-navbar sticky top-0 border-b border-[#F4EBE1] py-4 px-6 md:px-12 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <img 
                        src="/images/crumelle_logo.png" 
                        alt="Crumelle Cookies Logo" 
                        className="w-12 h-12 rounded-full border border-[#7A5C43]/20"
                    />
                    <span className="serif-font text-2xl font-bold tracking-wide text-[#3E2723]">Crumelle</span>
                </div>
                <div className="hidden md:flex gap-8 text-[#7A5C43] font-medium">
                    <a href="#" className="hover:text-[#3E2723] transition-colors">Home</a>
                    <a href="#menu" className="hover:text-[#3E2723] transition-colors">Our Menu</a>
                    <a href="#about" className="hover:text-[#3E2723] transition-colors">Packaging & Info</a>
                </div>
                <div className="flex items-center gap-4">
                    <Link 
                        href="/dashboard" 
                        className="text-[#7A5C43] hover:text-[#3E2723] font-medium border border-[#7A5C43]/30 px-4 py-1.5 rounded-full text-sm transition-all"
                    >
                        Admin Area
                    </Link>
                    <button 
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-2 bg-[#7A5C43] text-white rounded-full hover:bg-[#3E2723] transition-colors flex items-center justify-center"
                        aria-label="Open Cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        {getCartItemCount() > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#D62828] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#FCF8F4]">
                                {getCartItemCount()}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="crumelle-hero py-16 md:py-24 px-6 md:px-12 flex flex-col md:flex-row items-center gap-12 max-w-7xl mx-auto">
                <div className="crumelle-hero-overlay"></div>
                <div className="flex-1 text-center md:text-left z-10">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-[#3E2723] leading-tight">
                        CRUMELLE COOKIES
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-[#7A5C43] font-light max-w-lg">
                        Modern premium cookies with elegant flavors and irresistible soft-baked texture.
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                        <a href="#menu" className="btn-primary inline-flex justify-center items-center gap-2">
                            GET STARTED
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                        <a href="#about" className="btn-secondary text-center">
                            Learn More
                        </a>
                    </div>
                </div>
                <div className="flex-1 flex justify-center z-10 relative">
                    <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] overflow-hidden rounded-[40px_80px_60px_100px] border-8 border-white/60 shadow-lg">
                        <img 
                            src="/images/hero_banner.jpg" 
                            alt="Premium Cookies flying" 
                            className="w-100 h-100 object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-4 -left-4 bg-[#FFFFFF] p-4 rounded-2xl shadow-md border border-[#F4EBE1] flex items-center gap-3">
                        <span className="text-3xl">🍪</span>
                        <div>
                            <p className="text-xs text-[#7A5C43] uppercase tracking-wider font-semibold">Fresh Baked Daily</p>
                            <p className="text-sm font-bold text-[#3E2723]">100% French Butter</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Menu Section */}
            <main id="menu" className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#3E2723] uppercase tracking-wide">OUR PRODUCTS</h2>
                    <div className="w-24 h-1 bg-[#DDA15E] mx-auto mt-3 rounded-full"></div>
                </div>

                {/* Categories Tab list */}
                <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10 border-b border-[#F4EBE1] pb-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`filter-tab ${selectedCategory === cat ? 'active' : ''}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => {
                        const hasStock = product.stock > 0;
                        return (
                            <div 
                                key={product.id} 
                                className="product-card flex flex-col cursor-pointer"
                                onClick={() => {
                                    setSelectedProduct(product);
                                    setDetailQty(1);
                                }}
                            >
                                <div className="product-image-container">
                                    <span className="category-badge">{product.category}</span>
                                    {!hasStock && <span className="sold-out-badge">Habis</span>}
                                    <img 
                                        src={`/images/${product.photo}`} 
                                        alt={product.name} 
                                        className="product-image"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/images/classic_choco.jpg';
                                        }}
                                    />
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-[#3E2723] hover:text-[#7A5C43] transition-colors line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-[#BC6C25] font-semibold text-lg mt-1">
                                            {formatIDR(product.price)}
                                        </p>
                                        <p className="text-xs text-[#7A5C43] mt-2 line-clamp-2">
                                            {product.description || 'Tidak ada deskripsi.'}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-[#F4EBE1] flex justify-between items-center">
                                        <span className={`text-xs font-semibold ${hasStock ? 'text-[#2A9D8F]' : 'text-[#D62828]'}`}>
                                            {hasStock ? `Stok: ${product.stock} pcs` : 'Sold Out'}
                                        </span>
                                        <button
                                            disabled={!hasStock}
                                            onClick={(e) => {
                                                e.stopPropagation(); // prevent modal popup
                                                addToCart(product);
                                            }}
                                            className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                                        >
                                            {hasStock ? 'Beli' : 'Habis'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Packaging and Allergen info Section */}
            <section id="about" className="bg-[#FAF0E4] py-16 px-6 md:px-12 mt-12">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                        <h2 className="text-3xl font-bold text-[#3E2723] mb-4">Packaging & Product Care</h2>
                        <p className="text-[#7A5C43] leading-relaxed mb-6">
                            Karena cookies kami dibuat fresh tanpa bahan pengawet dengan tekstur soft-baked yang lumer, penanganan yang tepat sangat penting untuk menjaga kelezatan rasa.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#F4EBE1]">
                                <span className="text-2xl">📦</span>
                                <h4 className="font-bold text-[#3E2723] mt-2">Premium Packaging</h4>
                                <p className="text-xs text-[#7A5C43] mt-1">Dikemas kokoh menggunakan hard box Crumelle, dilapisi bubble wrap tebal dan segel pengaman.</p>
                            </div>
                            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#F4EBE1]">
                                <span className="text-2xl">⏳</span>
                                <h4 className="font-bold text-[#3E2723] mt-2">Daya Tahan Produk</h4>
                                <p className="text-xs text-[#7A5C43] mt-1">Kue tahan hingga 7 hari di suhu ruang, dan sampai 14 hari bila disimpan di dalam kulkas.</p>
                            </div>
                            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#F4EBE1]">
                                <span className="text-2xl">🔥</span>
                                <h4 className="font-bold text-[#3E2723] mt-2">Saran Penyajian</h4>
                                <p className="text-xs text-[#7A5C43] mt-1">Hangatkan cookies dalam microwave 10-15 detik untuk mendapatkan tekstur cokelat lumer sensasional.</p>
                            </div>
                            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#F4EBE1]">
                                <span className="text-2xl">⚠️</span>
                                <h4 className="font-bold text-[#3E2723] mt-2">Informasi Alergen</h4>
                                <p className="text-xs text-[#7A5C43] mt-1">Mengandung gluten (tepung), telur ayam, dan produk olahan susu (mentega, keju krim).</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 flex justify-center">
                        <div className="bg-white p-6 rounded-2xl border border-[#F4EBE1] shadow-md text-center max-w-sm">
                            <span className="text-5xl">❤️</span>
                            <h3 className="text-xl font-bold text-[#3E2723] mt-4">Happy Customers</h3>
                            <p className="text-[#7A5C43] italic text-sm mt-3">
                                "Crumelle Red Velvet Cream Cheese adalah cookies paling lumer yang pernah saya coba! Keseimbangan rasa manis adonan dan gurihnya krim keju bener-bener nagih."
                            </p>
                            <p className="text-xs font-semibold text-[#DDA15E] mt-4 uppercase tracking-wider">— Alena, Penikmat Dessert</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#3E2723] text-[#FAF0E4]/80 text-center py-10 border-t border-[#7A5C43]/20">
                <p className="text-sm">© 2026 Crumelle Cookies. Premium Artisan Soft-Baked Cookies. Crafted with love in Indonesia.</p>
            </footer>

            {/* Cart Backdrop */}
            <div 
                className={`cart-backdrop ${isCartOpen ? 'open' : ''}`}
                onClick={() => setIsCartOpen(false)}
            />

            {/* Cart Drawer */}
            <div className={`cart-drawer ${isCartOpen ? 'open' : ''} p-6 overflow-y-auto`}>
                <div className="flex justify-between items-center border-b border-[#F4EBE1] pb-4 mb-6">
                    <h3 className="text-xl font-bold text-[#3E2723] flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#7A5C43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Keranjang Belanja
                    </h3>
                    <button 
                        onClick={() => setIsCartOpen(false)}
                        className="text-[#7A5C43] hover:text-[#3E2723] p-1 rounded-full hover:bg-[#F4EBE1]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {cart.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                        <span className="text-5xl mb-4">🛒</span>
                        <p className="text-[#7A5C43] font-medium">Keranjang kamu masih kosong.</p>
                        <button 
                            onClick={() => setIsCartOpen(false)}
                            className="btn-primary mt-6 py-2 px-6"
                        >
                            Mulai Belanja
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col justify-between">
                        {/* Cart Items list */}
                        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                            {cart.map((item) => (
                                <div key={item.product.id} className="flex gap-4 bg-[#FCF8F4] p-3 rounded-xl border border-[#F4EBE1] relative">
                                    <img 
                                        src={`/images/${item.product.photo}`} 
                                        alt={item.product.name} 
                                        className="w-16 h-16 object-cover rounded-lg border border-[#F4EBE1]"
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#3E2723] text-sm line-clamp-1">{item.product.name}</h4>
                                        <p className="text-xs text-[#BC6C25] font-semibold mt-0.5">{formatIDR(item.product.price)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button 
                                                onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                                                className="w-6 h-6 rounded bg-[#F4EBE1] hover:bg-[#7A5C43] hover:text-white flex items-center justify-center font-bold text-xs"
                                            >-</button>
                                            <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                                                className="w-6 h-6 rounded bg-[#F4EBE1] hover:bg-[#7A5C43] hover:text-white flex items-center justify-center font-bold text-xs"
                                            >+</button>
                                            <span className="text-[10px] text-[#7A5C43]/70 ml-2">(Max {item.product.stock})</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeFromCart(item.product.id)}
                                        className="absolute top-2 right-2 text-[#7A5C43]/50 hover:text-[#D62828]"
                                        aria-label="Remove item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Order Form */}
                        <form onSubmit={handleCheckout} className="border-t border-[#F4EBE1] pt-6 mt-6 space-y-4">
                            <h4 className="font-bold text-[#3E2723] text-sm uppercase tracking-wider mb-2">Form Pengiriman</h4>
                            
                            {checkoutError && (
                                <div className="p-3 bg-[#FFECEC] text-[#D62828] text-xs font-semibold rounded-lg border border-[#D62828]/20">
                                    {checkoutError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Contoh: Tina Yu"
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">No. WhatsApp</label>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Contoh: 08123456789"
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Alamat Lengkap</label>
                                <textarea 
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Nama Jalan, Blok, Komplek, Kec/Kota"
                                    rows={2}
                                    className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Pilihan Kurir</label>
                                    <select 
                                        value={courier}
                                        onChange={(e) => setCourier(e.target.value)}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                    >
                                        <option value="Instant">Instant (Gojek/Grab)</option>
                                        <option value="Sameday">Sameday (Anteraja/Grab)</option>
                                        <option value="Ekspedisi">Ekspedisi (J&T/JNE)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#7A5C43] uppercase mb-1">Tanggal Kirim (PO)</label>
                                    <input 
                                        type="date" 
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full text-sm rounded-lg border-[#F4EBE1] focus:border-[#7A5C43] focus:ring-[#7A5C43] bg-[#FCF8F4]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[#F4EBE1] flex justify-between items-center text-[#3E2723]">
                                <span className="font-bold">Total Belanja:</span>
                                <span className="text-xl font-bold text-[#BC6C25]">{formatIDR(getCartTotal())}</span>
                            </div>

                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full btn-primary py-3 font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Memproses...
                                    </>
                                ) : (
                                    'Pesan Sekarang'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div className="premium-modal-backdrop" onClick={() => setSelectedProduct(null)}>
                    <div className="premium-modal max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-[#3E2723] p-2 rounded-full shadow-md z-15"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <img 
                                src={`/images/${selectedProduct.photo}`} 
                                alt={selectedProduct.name}
                                className="w-full h-64 object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/classic_choco.jpg';
                                }}
                            />
                        </div>
                        <div className="p-6 md:p-8">
                            <span className="bg-[#F4EBE1] text-[#7A5C43] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                                {selectedProduct.category}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-bold text-[#3E2723] mt-3">{selectedProduct.name}</h3>
                            <p className="text-2xl font-bold text-[#BC6C25] mt-1">{formatIDR(selectedProduct.price)}</p>
                            
                            <p className="text-[#7A5C43] mt-4 leading-relaxed text-sm md:text-base">
                                {selectedProduct.description || 'Tidak ada deskripsi.'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-[#FCF8F4] rounded-xl border border-[#F4EBE1] text-xs md:text-sm text-[#7A5C43]">
                                <div>
                                    <span className="font-bold block">Ukuran / Berat:</span>
                                    <span>{selectedProduct.weight || '-'}</span>
                                </div>
                                <div>
                                    <span className="font-bold block">Daya Tahan:</span>
                                    <span>{selectedProduct.shelf_life || '-'}</span>
                                </div>
                                <div className="col-span-2 mt-2">
                                    <span className="font-bold block">Saran Penyajian:</span>
                                    <span>{selectedProduct.serving_suggestion || '-'}</span>
                                </div>
                                <div className="col-span-2 mt-2">
                                    <span className="font-bold block text-[#D62828]">Alergen Highlights:</span>
                                    <span>
                                        {(() => {
                                            try {
                                                const ingredientsList = JSON.parse(selectedProduct.ingredients);
                                                return ingredientsList.join(', ');
                                            } catch (e) {
                                                return selectedProduct.ingredients || '-';
                                            }
                                        })()}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-[#F4EBE1] flex justify-between items-center">
                                <span className={`font-semibold text-sm ${selectedProduct.stock > 0 ? 'text-[#2A9D8F]' : 'text-[#D62828]'}`}>
                                    {selectedProduct.stock > 0 ? `Sedia ${selectedProduct.stock} pcs` : 'Stok Habis'}
                                </span>
                                
                                {selectedProduct.stock > 0 ? (
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 border border-[#F4EBE1] rounded-lg p-1 bg-[#FCF8F4]">
                                            <button 
                                                onClick={() => setDetailQty(q => Math.max(1, q - 1))}
                                                className="w-8 h-8 rounded bg-white hover:bg-[#F4EBE1] font-bold text-[#3E2723]"
                                            >-</button>
                                            <span className="w-8 text-center font-bold text-sm text-[#3E2723]">{detailQty}</span>
                                            <button 
                                                onClick={() => setDetailQty(q => Math.min(selectedProduct.stock, q + 1))}
                                                className="w-8 h-8 rounded bg-white hover:bg-[#F4EBE1] font-bold text-[#3E2723]"
                                            >+</button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                addToCart(selectedProduct, detailQty);
                                                setSelectedProduct(null);
                                            }}
                                            className="btn-primary py-3 px-6 text-sm font-semibold rounded-xl"
                                        >
                                            Tambah ke Keranjang
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        disabled
                                        className="btn-primary py-3 px-6 text-sm font-semibold rounded-xl"
                                    >
                                        Sold Out
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Success Modal with WhatsApp Checkout template */}
            {successOrder && (
                <div className="premium-modal-backdrop">
                    <div className="premium-modal max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-[#E8F5E9] text-[#2A9D8F] text-3xl rounded-full flex items-center justify-center mx-auto mb-4">
                            ✓
                        </div>
                        <h3 className="text-2xl font-bold text-[#3E2723]">Pesanan Tersimpan!</h3>
                        <p className="text-sm text-[#7A5C43] mt-2">
                            Pesanan Anda dengan nomor ID <strong>#{successOrder.id}</strong> telah berhasil dicatat ke sistem kami.
                        </p>
                        
                        <div className="my-6 p-4 bg-[#FCF8F4] border border-[#F4EBE1] rounded-xl text-left text-xs md:text-sm text-[#7A5C43] space-y-1">
                            <p><strong>Nama:</strong> {successOrder.customer_name}</p>
                            <p><strong>Penerima HP:</strong> {successOrder.customer_phone}</p>
                            <p><strong>Alamat:</strong> {successOrder.customer_address}</p>
                            <p><strong>Total Transfer:</strong> {formatIDR(successOrder.total_price)}</p>
                        </div>

                        <div className="space-y-3">
                            <a 
                                href={getWhatsAppUrl(successOrder)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full btn-primary py-3 font-semibold text-sm flex items-center justify-center gap-2 bg-[#2A9D8F] hover:bg-[#207D72]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                </svg>
                                Kirim Rincian ke WhatsApp Admin
                            </a>
                            <button 
                                onClick={() => setSuccessOrder(null)}
                                className="w-full btn-secondary py-3 text-sm"
                            >
                                Tutup Halaman
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
