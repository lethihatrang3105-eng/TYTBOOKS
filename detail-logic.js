// 1. Dán Cấu hình Firebase của dự án TYTBOOKS vào đây
const firebaseConfig = {
 apiKey: "AIzaSyBe6gOlb9CswH9IvwiDhw1__NZTWoohnWI",
  authDomain: "tytbooks-27460.firebaseapp.com",
  projectId: "tytbooks-27460",
  storageBucket: "tytbooks-27460.firebasestorage.app",
  messagingSenderId: "1042581712598",
  appId: "1:1042581712598:web:4389f25a6c71e59c96a377",
  measurementId: "G-9LTPX47CY3"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. LẤY ID SÁCH TỪ URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');
const detailContainer = document.getElementById('book-detail-content');

// Cập nhật số lượng giỏ hàng trên thanh Header ngay khi load trang
function updateHeaderCart() {
    let cart = JSON.parse(localStorage.getItem('tyt_cart')) || [];
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); // Cộng dồn tổng số lượng
    const cartText = document.getElementById('cart-count-text');
    if(cartText) cartText.innerText = totalItems + " sản phẩm";
}
updateHeaderCart(); // Chạy luôn

// 3. TẢI DỮ LIỆU TỪ FIREBASE VÀ VẼ GIAO DIỆN
if (!bookId) {
    detailContainer.innerHTML = '<h2 style="text-align: center; padding: 50px; color: red;">Không tìm thấy sản phẩm!</h2>';
} else {
    db.collection("books").doc(bookId).get().then((doc) => {
        if (doc.exists) {
            const book = doc.data();
            
            const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
            const currentPrice = formatPrice(book.price);
            
            let oldPriceHTML = '';
            if (book.originalPrice && book.originalPrice > book.price) {
                oldPriceHTML = `<span class="price-old" style="color: #999; text-decoration: line-through; font-size: 16px; margin-left: 15px;">${formatPrice(book.originalPrice)}</span>`;
            }

            const imageUrl = book.image ? book.image : 'https://via.placeholder.com/400x500?text=Chưa+có+ảnh';

            // Xử lý an toàn: Chống lỗi khi tên sách có chứa dấu ngoặc kép hoặc nháy đơn
            const safeTitle = book.title ? book.title.replace(/'/g, "\\'") : '';
            const safeAuthor = book.author ? book.author.replace(/'/g, "\\'") : '';

            // ĐỔ MÃ HTML (Bao gồm cả bố cục trên dưới và nền đen)
            detailContainer.innerHTML = `
                <div class="detail-top">
                    <div class="detail-image">
                        <img src="${imageUrl}" alt="${book.title}">
                    </div>
                    
                    <div class="detail-info">
                        <h1 class="detail-title" style="font-size: 24px; color: #333; margin-bottom: 10px;">${book.title}</h1>
                        <p class="detail-author" style="font-size: 14px; color: #666; margin-bottom: 20px;">Tác giả: <strong>${book.author || 'Đang cập nhật'}</strong></p>
                        
                        <div class="detail-price-box" style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <span class="price-current" style="color: #d9534f; font-size: 28px; font-weight: bold;">${currentPrice}</span>
                            ${oldPriceHTML}
                        </div>
                        
                        <div class="detail-meta" style="font-size: 14px; line-height: 1.8; color: #444;">
                            <p><strong>Nhà xuất bản:</strong> ${book.publisher || 'Đang cập nhật'}</p>
                            <p><strong>Số trang:</strong> ${book.pages ? book.pages + ' trang' : 'Đang cập nhật'}</p>
                            <p><strong>Tình trạng:</strong> Còn hàng</p>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 20px;">
                            <button class="btn-add-cart" onclick="addToCart('${safeTitle}', ${book.price}, '${imageUrl}', '${safeAuthor}')" style="padding: 15px; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; background: white; color: #d9534f; border: 1px solid #d9534f; width: 50%;">THÊM VÀO GIỎ HÀNG</button>
                            <button class="btn-add-cart" onclick="addToCart('${safeTitle}', ${book.price}, '${imageUrl}', '${safeAuthor}')" style="padding: 15px; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; background: #f26522; color: white; border: none; width: 50%;">MUA NGAY</button>
                        </div>
                    </div>
                </div>

                <div class="dark-section-wrapper">
                    <div class="dark-main-content">
                        <h2>Giới thiệu sản phẩm</h2>
                        <h3>${book.title}</h3>
                        <p class="desc-text">${book.description ? book.description.replace(/\n/g, '<br>') : 'Thông tin chi tiết đang cập nhật...'}</p>
                    </div>
                </div>
            `;
        } else {
            detailContainer.innerHTML = '<h2 style="text-align: center; padding: 50px; color: red;">Sản phẩm không tồn tại hoặc đã bị xóa!</h2>';
        }
    }).catch((error) => {
        console.error("Lỗi khi tải chi tiết: ", error);
        detailContainer.innerHTML = '<h2 style="text-align: center; padding: 50px; color: red;">Lỗi kết nối máy chủ!</h2>';
    });
}

// 4. HÀM THÊM VÀO GIỎ HÀNG VÀ BẬT POPUP
window.addToCart = function(title, price, imageUrl, author) {
    // Lưu vào LocalStorage
    let cart = JSON.parse(localStorage.getItem('tyt_cart')) || [];
    let existingItem = cart.find(item => item.title === title);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ title: title, price: price, image: imageUrl, author: author, quantity: 1 });
    }
    localStorage.setItem('tyt_cart', JSON.stringify(cart));

    // Tính toán số lượng và tổng tiền hiện tại trong giỏ
    let totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const formattedTotalPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice);
    const formattedSinglePrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    // Cập nhật Header
    const cartText = document.getElementById('cart-count-text');
    if(cartText) cartText.innerText = totalQty + " sản phẩm";

    // Cập nhật nội dung Popup
    document.getElementById('success-item-count').innerText = "1";
    document.getElementById('summary-count').innerText = totalQty;
    document.getElementById('modal-book-img').src = imageUrl;
    document.getElementById('modal-book-title').innerText = title;
    document.getElementById('modal-book-author').innerText = "Tác giả: " + (author || 'Đang cập nhật');
    document.getElementById('modal-book-price').innerText = formattedSinglePrice;
    document.getElementById('modal-total-price').innerText = formattedTotalPrice;
    document.getElementById('modal-final-price').innerText = formattedTotalPrice;

    // Hiển thị Popup
    document.getElementById('cartPopupModal').style.display = 'block';
};

// Hàm tắt Popup
window.closeCartModal = function() {
    document.getElementById('cartPopupModal').style.display = 'none';
};

// ==========================================
// PHẦN THÊM: CHỨC NĂNG TÌM KIẾM SẢN PHẨM
// ==========================================
// 1. Tự động tìm ô nhập liệu và nút kính lúp trên giao diện hiện tại
const searchInputEl = document.querySelector('.search-bar input');
const searchBtnEl = document.querySelector('.search-bar button');

// 2. Hàm thực thi khi người dùng ra lệnh tìm kiếm
window.executeSearch = function() {
    if (!searchInputEl) return;
    const keyword = searchInputEl.value.trim().toLowerCase();
    
    const bookGridEl = document.getElementById('book-grid');
    
    // NẾU ĐANG Ở TRANG CHỦ (Có lưới sản phẩm)
    if (bookGridEl) {
        // Lọc sách có tên chứa từ khóa
        const searchResults = typeof allBooks !== 'undefined' ? allBooks.filter(book => book.title.toLowerCase().includes(keyword)) : [];
        
        // Đổi tiêu đề danh mục thành "KẾT QUẢ TÌM KIẾM"
        const sectionTitle = document.querySelector('.section-title h2');
        if (sectionTitle) sectionTitle.innerText = keyword === '' ? 'TẤT CẢ SẢN PHẨM' : 'KẾT QUẢ TÌM KIẾM: ' + keyword.toUpperCase();

        // Xóa lưới cũ và in kết quả mới
        bookGridEl.innerHTML = ''; 
        if (searchResults.length === 0) {
            bookGridEl.innerHTML = `<p style="grid-column: span 4; text-align: center; color: #d9534f; padding: 40px; font-weight: bold;">Không tìm thấy sách nào chứa từ khóa "${keyword}"</p>`;
            return;
        }

        searchResults.forEach((book) => {
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
            const imageUrl = book.image ? book.image : 'https://via.placeholder.com/250x300?text=Chưa+có+ảnh';
            const productHTML = `
                <div class="product-card" onclick="window.location.href='detail.html?id=${book.id}'">
                    <button class="btn-delete" onclick="if(typeof deleteBook === 'function') deleteBook(event, '${book.id}')" title="Xóa sách này">✕</button>
                    <img src="${imageUrl}" alt="${book.title}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 4px; margin-bottom: 15px;">
                    <h3 class="product-name">${book.title}</h3>
                    <div class="product-price"><span class="new-price">${formattedPrice}</span></div>
                </div>
            `;
            bookGridEl.innerHTML += productHTML;
        });
    } 
    // NẾU ĐANG Ở TRANG KHÁC (Trang chi tiết, Giỏ hàng...)
    else {
        // Tự động chuyển hướng về trang chủ và mang theo từ khóa
        if (keyword) {
            window.location.href = `index.html?search=${encodeURIComponent(keyword)}`;
        }
    }
};

// 3. Gắn "tai nghe" (Sự kiện) cho nút bấm và phím Enter
if (searchBtnEl) {
    searchBtnEl.addEventListener('click', executeSearch);
}
if (searchInputEl) {
    searchInputEl.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Ngăn trình duyệt tải lại trang lung tung
            executeSearch();
        }
    });
}

// 4. Kích hoạt tìm kiếm tự động nếu chuyển từ trang khác về
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const searchKw = params.get('search');
    if (searchKw && document.getElementById('book-grid')) {
        if (searchInputEl) searchInputEl.value = searchKw;
        // Đợi 0.8 giây để Firebase kịp lấy dữ liệu sách về máy rồi mới lọc
        setTimeout(() => {
            executeSearch();
        }, 800);
    }
});