// 1. Dán Cấu hình Firebase của dự án TYTBOOKS vào đây
function updateHeaderCartOnHome() {
    let cart = JSON.parse(localStorage.getItem('tyt_cart')) || [];
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartText = document.getElementById('cart-count-text');
    if(cartText) cartText.innerText = totalItems + " sản phẩm";
}
updateHeaderCartOnHome();

const firebaseConfig = {
 apiKey: "AIzaSyBe6gOlb9CswH9IvwiDhw1__NZTWoohnWI",
  authDomain: "tytbooks-27460.firebaseapp.com",
  projectId: "tytbooks-27460",
  storageBucket: "tytbooks-27460.firebasestorage.app",
  messagingSenderId: "1042581712598",
  appId: "1:1042581712598:web:4389f25a6c71e59c96a377",
  measurementId: "G-9LTPX47CY3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// -------------------------------------------------------------------
// ĐOẠN MỚI: TỰ ĐỘNG ẨN "DANH MỤC NỔI BẬT" MÀ KHÔNG CẦN XÓA HTML
// -------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const headers = document.querySelectorAll('h2');
    headers.forEach(h2 => {
        if(h2.innerText.trim().toUpperCase() === 'DANH MỤC NỔI BẬT') {
            const parentDiv = h2.parentElement;
            if(parentDiv) parentDiv.style.display = 'none'; // Giấu nó đi
        }
    });
});

// -------------------------------------------------------------------
// PHẦN 1: XỬ LÝ ĐÓNG/MỞ POPUP (MODAL)
// -------------------------------------------------------------------
const modal = document.getElementById("addBookModal");
const btnClose = document.getElementById("btnCloseModal");

if (btnClose) {
    btnClose.onclick = function() {
        modal.style.display = "none";
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// -------------------------------------------------------------------
// PHẦN 2: LƯU SÁCH MỚI (ĐÃ BỌC LỚP BẢO VỆ CHỐNG CRASH)
// -------------------------------------------------------------------
const formAddBook = document.getElementById('addBookForm');
if (formAddBook) { 
    formAddBook.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmitForm');
        btnSubmit.innerText = "ĐANG TẢI LÊN..."; btnSubmit.disabled = true;

        try {
            let finalImageUrl = document.getElementById('bookImage').value.trim();
            const fileInput = document.getElementById('bookImageFile');

            if (fileInput && fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append("image", fileInput.files[0]);

                const imgbbResponse = await fetch("https://api.imgbb.com/1/upload?key=DÁN_MÃ_API_CỦA_BẠN_VÀO_ĐÂY", {
                    method: "POST",
                    body: formData
                });
                
                const imgbbData = await imgbbResponse.json();
                if (imgbbData.success) {
                    finalImageUrl = imgbbData.data.url; 
                } else {
                    throw new Error("Lỗi khi tải ảnh lên ImgBB!");
                }
            }

            if (!finalImageUrl) {
                alert("❌ Vui lòng chọn ảnh từ máy tính hoặc dán link URL!");
                btnSubmit.innerText = "ĐĂNG SẢN PHẨM"; btnSubmit.disabled = false;
                return;
            }

            // Lấy mã sách (nếu không nhập thì để trống)
            const bookCodeVal = document.getElementById('bookCode') ? document.getElementById('bookCode').value.trim() : '';

            await db.collection("books").add({
                title: document.getElementById('bookTitle').value,
                author: document.getElementById('bookAuthor').value,
                category: document.getElementById('bookCategory').value, 
                status: document.getElementById('book-status').value, 
                price: Number(document.getElementById('bookPrice').value),
                originalPrice: Number(document.getElementById('bookOriginalPrice').value),
                publisher: document.getElementById('bookPublisher').value,
                bookCode: bookCodeVal, // ĐÃ THÊM LƯU MÃ SÁCH VÀO DATABASE
                pages: Number(document.getElementById('bookPages').value),
                image: finalImageUrl, 
                description: document.getElementById('bookDescription').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() 
            });

            document.getElementById('statusMsg').innerText = "✅ Thêm sách thành công!";
            document.getElementById('statusMsg').style.color = "green";
            document.getElementById('addBookForm').reset(); 
            if(fileInput) fileInput.value = ""; 
            setTimeout(() => { modal.style.display = "none"; document.getElementById('statusMsg').innerText = ""; }, 1500);

        } catch (error) {
            console.error("Lỗi: ", error);
            alert("Lỗi tải lên: " + error.message);
        } finally {
            btnSubmit.innerText = "ĐĂNG SẢN PHẨM"; btnSubmit.disabled = false;
        }
    });
}

// -------------------------------------------------------------------
// PHẦN 3: HIỂN THỊ VÀ GOM NHÓM SẢN PHẨM THEO THỂ LOẠI (CÓ FLASH SALE)
// -------------------------------------------------------------------
window.allBooks = []; 
const urlParams = new URLSearchParams(window.location.search);
let currentFilter = urlParams.get('category') || 'all'; 
let currentKeyword = urlParams.get('search') ? urlParams.get('search').toLowerCase() : ''; 
let currentPriceFilter = 'all'; 
let isFlashSaleView = urlParams.get('flashsale') === 'true'; 

db.collection("books").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
    window.allBooks = []; 
    querySnapshot.forEach((doc) => {
        window.allBooks.push({ id: doc.id, ...doc.data() });
    });
    renderBooks(); 
});

function renderBooks() {
    const mainSection = document.querySelector('.product-section');
    if (!mainSection) return;
    mainSection.innerHTML = ''; 

    const isProductsPage = window.location.pathname.includes('products') || window.location.pathname.includes('danh-sach-san-pham.html');

    let filteredBooks = window.allBooks;

    if (isProductsPage && isFlashSaleView) {
        filteredBooks = filteredBooks.filter(book => book.flashSaleDiscount > 0);
    } else {
        if (currentFilter !== 'all') {
            filteredBooks = filteredBooks.filter(book => book.category === currentFilter);
        }
    }

    if (currentKeyword !== '') {
        filteredBooks = filteredBooks.filter(book => (book.title || "").toLowerCase().includes(currentKeyword));
    }

    if (currentPriceFilter !== 'all') {
        filteredBooks = filteredBooks.filter(book => {
            const discount = book.flashSaleDiscount || 0;
            const p = book.price * (1 - discount / 100); 
            if (currentPriceFilter === 'd100') return p < 100000;
            if (currentPriceFilter === '100-200') return p >= 100000 && p <= 200000;
            if (currentPriceFilter === '200-300') return p >= 200000 && p <= 300000;
            if (currentPriceFilter === '300-400') return p >= 300000 && p <= 400000;
            if (currentPriceFilter === 't400') return p > 400000;
            return true;
        });
    }

    if (filteredBooks.length === 0) {
        let msg = currentKeyword !== "" ? `Không tìm thấy sách: "${currentKeyword}"` : "Chưa có sản phẩm nào phù hợp.";
        mainSection.innerHTML = `<div class="section-title"><h2>KẾT QUẢ</h2></div><p style="grid-column: span 4; text-align: center; color: #105b4d; padding: 50px; font-weight: bold;">${msg}</p>`;
        return;
    }

    let groupedBooks = {};
    if (isProductsPage) {
        let title = 'TẤT CẢ SẢN PHẨM';
        if (isFlashSaleView) title = '⚡ SÁCH ĐANG CHẠY FLASH SALE';
        else if (currentKeyword) title = `TÌM KIẾM: '${currentKeyword.toUpperCase()}'`;
        else if (currentFilter !== 'all') title = currentFilter.toUpperCase();
        groupedBooks[title] = filteredBooks;
    } else {
        if (currentKeyword !== '') {
            groupedBooks[`KẾT QUẢ TÌM KIẾM: '${currentKeyword.toUpperCase()}'`] = filteredBooks;
        } else if (currentFilter !== 'all') {
            groupedBooks[currentFilter] = filteredBooks;
        } else {
            filteredBooks.forEach(book => {
                let cat = book.category || 'Chưa phân loại';
                if (!groupedBooks[cat]) groupedBooks[cat] = [];
                groupedBooks[cat].push(book);
            });
        }
    }

    for (const [category, books] of Object.entries(groupedBooks)) {
        if (books.length === 0) continue;
        let sectionTitle = category === 'Sách' ? 'SÁCH - TRUYỆN TRANH' : category;

        let groupHTML = `
            <div class="section-title" style="margin-top: ${!isProductsPage && currentFilter === 'all' && currentKeyword === '' ? '40px' : '0'}; border-bottom: 2px solid #105b4d; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: baseline;">
                <h2 style="margin: 0; color: #105b4d; font-size: 20px; text-transform: uppercase;">${sectionTitle}</h2>
                ${(!isProductsPage && currentFilter === 'all' && currentKeyword === '') ? `<a href="products.html?category=${encodeURIComponent(category)}" style="color: #007bff; text-decoration: none; font-size: 14px; font-weight: bold;">Xem tất cả ››</a>` : ''}
            </div>
            <div class="product-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
        `;

        let displayBooks = (!isProductsPage && currentFilter === 'all' && currentKeyword === '') ? books.slice(0, 8) : books;

        displayBooks.forEach((book) => {
            let finalPrice = book.price;
            let oldPrice = book.originalPrice || '';
            let discountPercent = 0;

            if (book.flashSaleDiscount > 0) {
                discountPercent = book.flashSaleDiscount;
                finalPrice = book.price * (1 - discountPercent / 100);
                oldPrice = book.price; 
            } else if (book.originalPrice && book.originalPrice > book.price) {
                discountPercent = Math.round((1 - book.price / book.originalPrice) * 100);
            }

            const formatNewPrice = new Intl.NumberFormat('vi-VN').format(finalPrice) + 'đ';
            const formatOldPrice = oldPrice ? new Intl.NumberFormat('vi-VN').format(oldPrice) + 'đ' : '';
            const badgeHTML = discountPercent > 0 ? `<div style="background: #e74c3c; color: white; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;">-${discountPercent}%</div>` : '';
            const imageUrl = book.image ? book.image : 'https://via.placeholder.com/250x300?text=Chưa+có+ảnh';
            const publisherName = book.publisher ? book.publisher.toUpperCase() : (book.category ? book.category.toUpperCase() : 'TYTBOOKS');

            groupHTML += `
                <div class="product-card" onclick="window.location.href='detail.html?id=${book.id}'" style="background: #fff; border-radius: 8px; padding: 15px; position: relative; cursor: pointer; transition: transform 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    
                    <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 8px; z-index: 10;">
                        <button class="btn-edit-item" style="display: none; background: #007bff; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 15px; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.2); padding: 0; line-height: 32px;" onclick="event.stopPropagation(); openEditModal('${book.id}')" title="Sửa">✎</button>
                        <button class="btn-delete" style="display: none; background: #dc3545; color: white; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 15px; cursor: pointer; box-shadow: 0 3px 6px rgba(0,0,0,0.2); padding: 0; line-height: 32px;" onclick="event.stopPropagation(); deleteBook('${book.id}')" title="Xóa">✕</button>
                    </div>
                    
                    <div style="position: relative; width: 100%; height: 180px; margin-bottom: 15px; border-radius: 4px; overflow: hidden;"
     onmouseover="this.querySelector('.qv-overlay').style.opacity='1'"
     onmouseout="this.querySelector('.qv-overlay').style.opacity='0'">
    <img src="${imageUrl}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: contain;">
    
    <div class="qv-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.4); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s; z-index: 5;">
        <div onclick="event.stopPropagation(); openQuickView('${book.id}')" style="background: #333; color: white; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='#105b4d';" onmouseout="this.style.transform='scale(1)'; this.style.background='#333';" title="Xem nhanh">
            <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        </div>
    </div>
</div>
                    <div style="font-size: 11px; color: #999; margin-bottom: 5px; font-weight: bold;">${publisherName}</div>
                    <h3 class="product-name" style="font-size: 14px; height: 40px; overflow: hidden; margin-bottom: 10px; color: #333; line-height: 1.4;">${book.title}</h3>
                    
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; flex: 1;">
                        <div style="display: flex; flex-direction: column;">
                            <span class="new-price" style="color: #d0021b; font-weight: bold; font-size: 16px; margin-bottom: 3px;">${formatNewPrice}</span>
                            <span style="color: #999; text-decoration: line-through; font-size: 12px; min-height: 15px;">${formatOldPrice}</span>
                        </div>
                        ${badgeHTML}
                    </div>

                    <div style="display: flex; gap: 12px; align-items: center;" onclick="event.stopPropagation();">
                        <button onclick="let qty = parseInt(document.getElementById('qty-${book.id}').innerText); alert('Đã thêm ' + qty + ' sản phẩm vào giỏ!'); if(typeof addToCart === 'function') { for(let i=0; i<qty; i++) { setTimeout(() => addToCart('${book.id}'), i*200); } }" style="background: #e74c3c; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; box-shadow: 0 2px 4px rgba(231,76,60,0.3);" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'" title="Thêm vào giỏ">
                            
                            <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: white;">
                                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z"/>
                            </svg>

                        </button>

                        <div style="display: flex; align-items: center; border: 1px solid #ddd; border-radius: 20px; overflow: hidden; height: 32px; width: 95px; background: #fff;">
                            <button onclick="let q=document.getElementById('qty-${book.id}'); if(parseInt(q.innerText)>1) q.innerText=parseInt(q.innerText)-1;" style="background: transparent; border: none; width: 30px; font-size: 18px; color: #888; cursor: pointer; transition: 0.2s; padding: 0; line-height: 1;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#888'">-</button>
                            <span id="qty-${book.id}" style="flex: 1; text-align: center; font-size: 13px; font-weight: bold; color: #333;">1</span>
                            <button onclick="let q=document.getElementById('qty-${book.id}'); q.innerText=parseInt(q.innerText)+1;" style="background: transparent; border: none; width: 30px; font-size: 16px; color: #888; cursor: pointer; transition: 0.2s; padding: 0; line-height: 1;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#888'">+</button>
                        </div>
                    </div>
                </div>
            `;
        });
        groupHTML += `</div>`;
        mainSection.innerHTML += groupHTML;
    }
    checkAdminDisplay();
}

// -------------------------------------------------------------------
// PHẦN 4: HÀM CHUYỂN TRANG, TÌM KIẾM VÀ LỌC GIÁ
// -------------------------------------------------------------------
window.filterCategory = function(event, categoryName) {
    if(event) event.preventDefault(); 
    const isProductsPage = window.location.pathname.includes('products') || window.location.pathname.includes('danh-sach-san-pham.html');
    if (!isProductsPage) {
        window.location.href = `products.html?category=${encodeURIComponent(categoryName)}`;
        return;
    }
    currentFilter = categoryName; 
    currentKeyword = ''; 
    currentPriceFilter = 'all';
    isFlashSaleView = false; // Tự động thoát chế độ flash sale khi khách bấm vào danh mục bên trái
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) searchInput.value = '';
    window.history.pushState({}, '', `products.html?category=${encodeURIComponent(categoryName)}`);
    renderBooks(); 
}

window.executeSearch = function() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    const isProductsPage = window.location.pathname.includes('products') || window.location.pathname.includes('danh-sach-san-pham.html');
    if (!isProductsPage) {
        window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
        return;
    }
    currentKeyword = keyword;
    currentFilter = 'all'; 
    currentPriceFilter = 'all';
    isFlashSaleView = false; 
    window.history.pushState({}, '', `products.html?search=${encodeURIComponent(keyword)}`);
    renderBooks();
};

document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.search-bar input');
    const btn = document.querySelector('.search-bar button');
    if (input) {
        input.addEventListener('input', window.executeSearch); 
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') window.executeSearch(); });
    }
    if (btn) btn.addEventListener('click', window.executeSearch);
});

window.filterByPrice = function(rangeValue) {
    currentPriceFilter = rangeValue;
    renderBooks();
}
// ==========================================
// HÀM XỬ LÝ XÓA SÁCH & SỬA SÁCH 
// ==========================================
window.deleteBook = function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa cuốn sách này không? Hành động này không thể hoàn tác!")) {
        db.collection("books").doc(id).delete()
        .then(() => alert("Đã xóa sách khỏi hệ thống thành công!"))
        .catch((error) => alert("Không thể xóa sách. Có thể do lỗi kết nối hoặc quyền hạn!"));
    }
};

// ==========================================
// HÀM XỬ LÝ XÓA SÁCH & SỬA SÁCH 
// ==========================================
window.deleteBook = function(id) {
    if (confirm("Bạn có chắc chắn muốn xóa cuốn sách này không? Hành động này không thể hoàn tác!")) {
        db.collection("books").doc(id).delete()
        .then(() => alert("Đã xóa sách khỏi hệ thống thành công!"))
        .catch((error) => alert("Không thể xóa sách. Có thể do lỗi kết nối hoặc quyền hạn!"));
    }
};

window.openEditModal = function(id) {
    db.collection("books").doc(id).get().then((doc) => {
        if (doc.exists) {
            const book = doc.data();
            document.getElementById('edit-book-id').value = id;
            document.getElementById('edit-book-title').value = book.title || "";
            document.getElementById('edit-book-author').value = book.author || "";
            
            // Các trường mới
            document.getElementById('edit-book-code').value = book.bookCode || "";
            document.getElementById('edit-book-publisher').value = book.publisher || "";
            document.getElementById('edit-book-pages').value = book.pages || "";
            document.getElementById('edit-book-originalPrice').value = book.originalPrice || "";
            
            document.getElementById('edit-book-price').value = book.price || 0;
            document.getElementById('edit-book-category').value = book.category || "";
            document.getElementById('edit-book-status').value = book.status || "Còn hàng"; 
            document.getElementById('edit-book-image').value = book.image || "";
            document.getElementById('edit-book-description').value = book.description || "";
            
            const fileInput = document.getElementById('edit-book-image-file');
            if(fileInput) fileInput.value = "";
            
            document.getElementById('editBookModal').style.display = 'block';
        }
    });
};

window.updateBookInFirebase = async function() {
    const id = document.getElementById('edit-book-id').value;
    const btnSave = document.getElementById('btnSaveEditBook');
    const oldText = btnSave.innerText;
    btnSave.innerText = "ĐANG LƯU..."; btnSave.disabled = true;

    try {
        let finalImageUrl = document.getElementById('edit-book-image').value.trim();
        const fileInput = document.getElementById('edit-book-image-file');

        if (fileInput && fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append("image", fileInput.files[0]);

            const imgbbResponse = await fetch("https://api.imgbb.com/1/upload?key=d7b00b2423e2637f15f86e4a81c1147d", {
                method: "POST",
                body: formData
            });
            
            const imgbbData = await imgbbResponse.json();
            if (imgbbData.success) {
                finalImageUrl = imgbbData.data.url;
            } else {
                throw new Error("Lỗi tải ảnh lên ImgBB!");
            }
        }

        const newData = {
            title: document.getElementById('edit-book-title').value,
            author: document.getElementById('edit-book-author').value,
            
            // Gửi các trường mới lên Firebase
            bookCode: document.getElementById('edit-book-code').value,
            publisher: document.getElementById('edit-book-publisher').value,
            pages: Number(document.getElementById('edit-book-pages').value),
            originalPrice: Number(document.getElementById('edit-book-originalPrice').value),
            
            price: Number(document.getElementById('edit-book-price').value),
            category: document.getElementById('edit-book-category').value,
            status: document.getElementById('edit-book-status').value, 
            image: finalImageUrl,
            description: document.getElementById('edit-book-description').value
        };

        await db.collection("books").doc(id).update(newData);
        alert("Cập nhật thành công!");
        document.getElementById('editBookModal').style.display = 'none';
        if(fileInput) fileInput.value = "";
    } catch (err) {
        alert("Lỗi: " + err.message);
    } finally {
        btnSave.innerText = oldText; btnSave.disabled = false;
    }
};

// ==========================================
// HỆ THỐNG QUẢN LÝ ĐƠN HÀNG
// ==========================================
window.openOrderManager = function() {
    document.getElementById('orderManagerModal').style.display = 'block';
    const orderListDiv = document.getElementById('admin-orders-list');
    orderListDiv.innerHTML = '<p style="text-align: center; color: #666; font-weight: bold;">Đang lấy dữ liệu từ hệ thống...</p>';

    db.collection("orders").orderBy("createdAt", "desc").get().then((snapshot) => {
        orderListDiv.innerHTML = '';
        if (snapshot.empty) {
            orderListDiv.innerHTML = '<p style="text-align:center; color:#d9534f; font-weight: bold;">Chưa có đơn hàng nào cần xử lý.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const orderId = doc.id;
            
            let dateStr = "Chưa rõ thời gian";
            if (order.createdAt) {
                const dateObj = order.createdAt.toDate();
                dateStr = dateObj.toLocaleDateString('vi-VN') + " " + dateObj.toLocaleTimeString('vi-VN');
            }

            let itemsHTML = '';
            (order.items || []).forEach(item => {
                itemsHTML += `<li style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px;">- ${item.quantity || 1} x <strong style="color: #333;">${item.title}</strong></li>`;
            });

            const formatPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || 0);
            let statusColor = order.status === "Đã giao" ? "#28a745" : "#f26522"; 

            const orderCard = `
                <div style="border: 1px solid #eaeaea; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #f1f1f1; padding-bottom: 15px; margin-bottom: 15px;">
                        <span style="font-size: 14px; color: #555;">Ngày đặt: <strong>${dateStr}</strong></span>
                        <span style="font-size: 13px; font-weight: bold; color: ${statusColor}; background: #fff; padding: 5px 15px; border: 2px solid ${statusColor}; border-radius: 20px;">${order.status}</span>
                    </div>
                    
                    <div style="display: flex; gap: 25px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 250px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                            <p style="margin: 0 0 10px 0; font-size: 14px;">👤 Khách: <strong style="font-size: 16px; color: #333;">${order.customerName}</strong></p>
                            <p style="margin: 0 0 10px 0; font-size: 14px;">📞 SĐT: <strong>${order.customerPhone}</strong></p>
                            <p style="margin: 0 0 10px 0; font-size: 14px;">📍 Đ/c: ${order.customerAddress}</p>
                            <p style="margin: 0; font-size: 14px; color:#d9534f; font-style: italic;">📝 Ghi chú: ${order.note || 'Không có'}</p>
                        </div>
                        
                        <div style="flex: 1.5; min-width: 300px; display: flex; flex-direction: column;">
                            <p style="font-weight: bold; margin: 0 0 10px 0; font-size: 15px; color: #333;">Sản phẩm đặt mua:</p>
                            <div style="background: #fff; border: 1px solid #eee; padding: 12px; border-radius: 8px; max-height: 120px; overflow-y: auto; margin-bottom: 15px;">
                                <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; line-height: 1.8;">
                                    ${itemsHTML}
                                </ul>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                                <p style="font-size: 16px; margin: 0;">Tổng tiền: <strong style="color: #C92127; font-size: 20px;">${formatPrice}</strong></p>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="markOrderDone('${orderId}')" style="background: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(40,167,69,0.3);">✔ Đã giao</button>
                                    <button onclick="deleteOrder('${orderId}')" style="background: #dc3545; color: white; border: none; padding: 10px 15px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(220,53,69,0.3);">🗑 Hủy đơn</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            orderListDiv.innerHTML += orderCard;
        });
    }).catch(err => {
        orderListDiv.innerHTML = '<p style="color:red; text-align:center;">Lỗi tải dữ liệu: ' + err.message + '</p>';
    });
};

window.markOrderDone = function(orderId) {
    if(confirm("Xác nhận đơn hàng này ĐÃ GIAO thành công?")) {
        db.collection("orders").doc(orderId).update({ status: "Đã giao" }).then(() => {
            alert("Đã cập nhật trạng thái!");
            openOrderManager(); 
        });
    }
};

window.deleteOrder = function(orderId) {
    if(confirm("Bạn có chắc chắn muốn XÓA/HỦY đơn hàng này? Khách hàng sẽ buồn đó nha!")) {
        db.collection("orders").doc(orderId).delete().then(() => {
            alert("Đã xóa đơn hàng.");
            openOrderManager(); 
        });
    }
};

// ==========================================
// PHẦN THÊM: PHÂN QUYỀN GIAO DIỆN & LẮNG NGHE ĐĂNG NHẬP
// ==========================================
function checkAdminDisplay() {
    const user = auth.currentUser;
    const btnAdminAccess = document.getElementById('btnAdminAccess');
    const deleteButtons = document.querySelectorAll('.btn-delete');
    const editButtons = document.querySelectorAll('.btn-edit-item');

    if (user && user.email === 'lethihatrang3105@gmail.com') {
        if(btnAdminAccess) btnAdminAccess.style.display = 'inline-block';
        deleteButtons.forEach(btn => btn.style.display = 'inline-block');
        editButtons.forEach(btn => btn.style.display = 'inline-block');
    } else {
        if(btnAdminAccess) btnAdminAccess.style.display = 'none';
        deleteButtons.forEach(btn => btn.style.display = 'none');
        editButtons.forEach(btn => btn.style.display = 'none');
    }
}

auth.onAuthStateChanged(user => {
    const btnLogin = document.getElementById('btn-show-login');
    const btnRegister = document.getElementById('btn-show-register');
    const btnLogout = document.getElementById('btn-logout');
    const greeting = document.getElementById('user-greeting');

    if (user) {
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnRegister) btnRegister.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'inline-block';
        if(greeting) {
            greeting.style.display = 'inline-block';
            greeting.innerText = 'Xin chào, ' + (user.displayName || user.email);
        }
    } else {
        if(btnLogin) btnLogin.style.display = 'inline-block';
        if(btnRegister) btnRegister.style.display = 'inline-block';
        if(btnLogout) btnLogout.style.display = 'none';
        if(greeting) greeting.style.display = 'none';
    }

    checkAdminDisplay();
});

db.collection("books").onSnapshot(() => {
    setTimeout(checkAdminDisplay, 300); 
});

// ==========================================
// CHUYỂN ĐỔI FORM ĐĂNG NHẬP / ĐĂNG KÝ
// ==========================================
window.showLoginForm = function() {
    document.getElementById('login-form-area').style.display = 'block';
    document.getElementById('register-form-area').style.display = 'none';
    document.getElementById('auth-title').innerText = 'Đăng nhập';
};

window.showRegisterForm = function() {
    document.getElementById('login-form-area').style.display = 'none';
    document.getElementById('register-form-area').style.display = 'block';
    document.getElementById('auth-title').innerText = 'Đăng ký tài khoản';
};

window.loginWithEmail = function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    if(!email || !pass) { alert("Vui lòng nhập đủ email và mật khẩu!"); return; }
    
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(() => {
            alert("🎉 Đăng nhập thành công!");
            document.getElementById('authModal').style.display = 'none';
            window.location.reload(); 
        })
        .catch((error) => {
            alert("Lỗi: Email hoặc mật khẩu không chính xác!");
        });
};

window.registerWithEmail = function() {
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value.trim();
    if(!email || !pass || !name) { alert("Vui lòng điền đầy đủ thông tin!"); return; }

    firebase.auth().createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            return userCredential.user.updateProfile({ displayName: name });
        })
        .then(() => {
            alert("🎉 Đăng ký thành công! Chào mừng " + name + " đến với TYTBOOKS");
            document.getElementById('authModal').style.display = 'none';
            window.location.reload();
        })
        .catch((error) => {
            alert("Lỗi đăng ký: " + error.message);
        });
};

window.loginWithGoogle = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            alert("🎉 Đăng nhập Google thành công!");
            document.getElementById('authModal').style.display = 'none';
            window.location.reload(); 
        })
        .catch((error) => {
            alert("Lỗi đăng nhập Google: " + error.message);
        });
};

window.loginWithFacebook = function() {
    const provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            alert("🎉 Đăng nhập Facebook thành công!");
            document.getElementById('authModal').style.display = 'none';
            window.location.reload();
        })
        .catch((error) => {
            alert("Tính năng Facebook hiện chưa được cấu hình trên Firebase. Vui lòng dùng Google hoặc Email!");
        });
};

window.logoutUser = function() {
    firebase.auth().signOut().then(() => {
        alert("Đã đăng xuất thành công!");
        window.location.reload();
    }).catch((error) => {
        alert("Lỗi đăng xuất: " + error.message);
    });
};

// ==========================================
// HỆ THỐNG QUẢN LÝ BANNER ĐỘNG (LÊN TỚI 10 ẢNH)
// ==========================================
db.collection("config").doc("homepage").onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        const validLinks = []; 

        for (let i = 1; i <= 10; i++) {
            const link = data[`banner${i}`];
            if (link && link.trim() !== "") {
                validLinks.push(link.trim());
            }
            
            const inputUrlField = document.getElementById(`admin-banner-url-${i}`);
            if (inputUrlField) {
                inputUrlField.value = link || '';
            }
        }

        const bannerWrapper = document.getElementById('home-banner');
        if (bannerWrapper) {
            document.querySelectorAll('.my-slide').forEach(el => el.remove());

            if (validLinks.length === 0) {
                validLinks.push("https://theme.hstatic.net/200000343865/1001052087/14/slide_1_img.jpg?v=480");
            }

            validLinks.reverse().forEach((link) => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'my-slide';
                slideDiv.style.display = 'none';
                slideDiv.style.animation = 'fadeBanner 1.5s';
                slideDiv.style.height = '100%';
                slideDiv.innerHTML = `<img src="${link}" style="width: 100%; height: 100%; display: block; object-fit: cover;">`;
                bannerWrapper.prepend(slideDiv);
            });

            const newSlides = document.querySelectorAll('.my-slide');
            if(newSlides.length > 0) {
                newSlides[0].style.display = 'block';
            }
            
            if(typeof currentSlideIndex !== 'undefined') {
                currentSlideIndex = 0;
            }
        }
    }
});

window.saveBannersToFirebase = async function() {
    const btnSave = document.querySelector('#bannerModal button');
    if (btnSave) {
        btnSave.innerText = "ĐANG TẢI ẢNH LÊN (Vui lòng đợi)...";
        btnSave.disabled = true;
    }

    const bannerData = {};
    const imgbbApiKey = "DÁN_MÃ_API_CỦA_BẠN_VÀO_ĐÂY"; 

    try {
        for (let i = 1; i <= 10; i++) {
            const fileInput = document.getElementById(`admin-banner-file-${i}`);
            const urlInput = document.getElementById(`admin-banner-url-${i}`);
            let finalUrl = "";

            if (fileInput && fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append("image", fileInput.files[0]);

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                    method: "POST",
                    body: formData
                });
                const data = await response.json();
                
                if (data.success) {
                    finalUrl = data.data.url;
                } else {
                    throw new Error(`Lỗi tải ảnh Banner ${i} lên ImgBB!`);
                }
            } else if (urlInput && urlInput.value.trim() !== "") {
                finalUrl = urlInput.value.trim();
            }

            bannerData[`banner${i}`] = finalUrl;
        }

        await db.collection("config").doc("homepage").set(bannerData, { merge: true });
        
        alert("Cập nhật Banner thành công! Số lượng và ảnh đã tự động tối ưu.");
        document.getElementById('bannerModal').style.display = 'none';
        
        for (let i = 1; i <= 10; i++) {
            if(document.getElementById(`admin-banner-file-${i}`)) {
                document.getElementById(`admin-banner-file-${i}`).value = "";
            }
        }

    } catch (err) {
        alert("Lỗi: " + err.message);
    } finally {
        if (btnSave) {
            btnSave.innerText = "LƯU BANNER";
            btnSave.disabled = false;
        }
    }
};

// ==========================================
// HỆ THỐNG BÁO CÁO THỐNG KÊ (CÓ CHI TIẾT)
// ==========================================
window.statsData = { completedOrders: [], allOrders: [], pendingOrders: [], allBooks: [], totalRevenue: 0 };

window.openStatsManager = async function() {
    document.getElementById('statsModal').style.display = 'block';
    document.getElementById('stats-loading').style.display = 'block';
    document.getElementById('stats-dashboard').style.display = 'none';
    document.getElementById('stats-detail-view').style.display = 'none';

    try {
        window.statsData = { completedOrders: [], allOrders: [], pendingOrders: [], allBooks: [], totalRevenue: 0 };

        const ordersSnapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            order.id = doc.id;
            
            if (order.createdAt) {
                order.dateStr = order.createdAt.toDate().toLocaleDateString('vi-VN');
            } else {
                order.dateStr = "N/A";
            }

            window.statsData.allOrders.push(order);
            
            if (order.status === "Đã giao") {
                window.statsData.completedOrders.push(order);
                window.statsData.totalRevenue += (Number(order.totalAmount) || 0);
            } else {
                window.statsData.pendingOrders.push(order);
            }
        });

        const booksSnapshot = await db.collection("books").orderBy("title").get();
        booksSnapshot.forEach(doc => {
            const book = doc.data();
            book.id = doc.id;
            window.statsData.allBooks.push(book);
        });

        const formatMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(window.statsData.totalRevenue);
        document.getElementById('stat-revenue').innerText = formatMoney;
        document.getElementById('stat-orders').innerText = window.statsData.allOrders.length + " đơn";
        document.getElementById('stat-pending').innerText = window.statsData.pendingOrders.length + " đơn";
        document.getElementById('stat-books').innerText = window.statsData.allBooks.length + " cuốn";

        document.getElementById('stats-loading').style.display = 'none';
        document.getElementById('stats-dashboard').style.display = 'grid';

    } catch (error) {
        document.getElementById('stats-loading').innerText = "❌ Lỗi tải dữ liệu: " + error.message;
    }
};

window.showStatsDetail = function(type) {
    document.getElementById('stats-dashboard').style.display = 'none';
    document.getElementById('stats-detail-view').style.display = 'block';
    
    const titleEl = document.getElementById('detail-title');
    const contentEl = document.getElementById('detail-content');
    const formatMoney = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    
    let html = '';

    if (type === 'revenue') {
        titleEl.innerText = "💰 Chi tiết Doanh Thu (Các đơn đã giao thành công)";
        if (window.statsData.completedOrders.length === 0) {
            contentEl.innerHTML = "<p style='padding: 20px; text-align: center; color: #666;'>Chưa có doanh thu.</p>"; return;
        }
        html += `<table style="width:100%; border-collapse: collapse; font-size:14px; text-align: left;">
                    <tr style="background:#f8f9fa;"><th style="padding:12px; border-bottom:1px solid #ddd;">Ngày</th><th style="padding:12px; border-bottom:1px solid #ddd;">Khách hàng</th><th style="padding:12px; border-bottom:1px solid #ddd; text-align:right;">Thành tiền</th></tr>`;
        window.statsData.completedOrders.forEach(o => {
            html += `<tr>
                        <td style="padding:12px; border-bottom:1px solid #eee;">${o.dateStr}</td>
                        <td style="padding:12px; border-bottom:1px solid #eee;"><strong>${o.customerName}</strong></td>
                        <td style="padding:12px; border-bottom:1px solid #eee; text-align:right; color:#28a745; font-weight:bold;">${formatMoney.format(o.totalAmount)}</td>
                     </tr>`;
        });
        html += `</table>`;

    } else if (type === 'orders') {
        titleEl.innerText = "📦 Danh sách Tất cả Đơn Hàng";
        if (window.statsData.allOrders.length === 0) {
            contentEl.innerHTML = "<p style='padding: 20px; text-align: center;'>Chưa có đơn hàng nào.</p>"; return;
        }
        html += `<ul style="list-style:none; padding:0; margin: 0;">`;
        window.statsData.allOrders.forEach(o => {
            let color = o.status === "Đã giao" ? "#28a745" : "#f26522";
            html += `<li style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items: center;">
                        <div>
                            <strong style="font-size:15px; color:#333;">${o.customerName}</strong>
                            <div style="font-size:12px; color:#777; margin-top:3px;">Ngày: ${o.dateStr} | SĐT: ${o.customerPhone}</div>
                        </div>
                        <span style="color:${color}; font-weight:bold; font-size:12px; border:1px solid ${color}; padding:4px 8px; border-radius:12px;">${o.status}</span>
                     </li>`;
        });
        html += `</ul>`;

    } else if (type === 'pending') {
        titleEl.innerText = "⏳ Danh sách Đơn Chờ Xử Lý";
        if (window.statsData.pendingOrders.length === 0) {
            contentEl.innerHTML = "<p style='padding: 20px; text-align: center; color: green; font-weight:bold;'>Tuyệt vời! Không có đơn hàng nào đang tồn đọng.</p>"; return;
        }
        html += `<ul style="list-style:none; padding:0; margin: 0;">`;
        window.statsData.pendingOrders.forEach(o => {
            html += `<li style="padding:15px; border-bottom:1px solid #eee; background:#fffdf5;">
                        <strong style="font-size:15px; color:#d9534f;">${o.customerName}</strong> - <span style="color:#555;">${o.customerPhone}</span>
                        <div style="font-size:13px; color:#666; margin-top:5px;">📍 Địa chỉ: ${o.customerAddress}</div>
                     </li>`;
        });
        html += `</ul>`;

    } else if (type === 'books') {
        titleEl.innerText = `📚 Chi tiết Sách trong kho (${window.statsData.allBooks.length} cuốn)`;
        if (window.statsData.allBooks.length === 0) {
            contentEl.innerHTML = "<p style='padding: 20px; text-align: center;'>Kho sách đang trống.</p>"; return;
        }
        html += `<div style="max-height: 500px; overflow-y: auto;">
                 <table style="width:100%; border-collapse: collapse; font-size:14px; text-align: left;">
                    <tr style="background:#f8f9fa; position: sticky; top: 0; z-index: 10;">
                        <th style="padding:12px; border-bottom:1px solid #ddd; width: 60px;">Ảnh</th>
                        <th style="padding:12px; border-bottom:1px solid #ddd;">Tên sách</th>
                        <th style="padding:12px; border-bottom:1px solid #ddd;">Danh mục</th>
                        <th style="padding:12px; border-bottom:1px solid #ddd; text-align:right;">Giá bán</th>
                    </tr>`;
        window.statsData.allBooks.forEach(b => {
            // Kiểm tra nếu không có ảnh thì dùng ảnh tạm (placeholder)
            const bookImg = b.image ? b.image : 'https://via.placeholder.com/50';
            html += `<tr>
                        <td style="padding:10px; border-bottom:1px solid #eee;">
                            <img src="${bookImg}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                        </td>
                        <td style="padding:10px; border-bottom:1px solid #eee; color:#333; font-weight:bold;">${b.title}</td>
                        <td style="padding:10px; border-bottom:1px solid #eee; color:#666; font-size:13px;">${b.category}</td>
                        <td style="padding:10px; border-bottom:1px solid #eee; text-align:right; color:#d0021b; font-weight:bold;">${formatMoney.format(b.price)}</td>
                     </tr>`;
        });
        html += `</table></div>`;
    }

    contentEl.innerHTML = html;
};

window.backToStatsDashboard = function() {
    document.getElementById('stats-detail-view').style.display = 'none';
    document.getElementById('stats-dashboard').style.display = 'grid';
};
// ==========================================
// HỆ THỐNG QUẢN LÝ VÀ HIỂN THỊ FLASH SALE
// ==========================================

// 1. Mở bảng điều khiển Flash Sale
window.openFlashSaleManager = function() {
    document.getElementById('flashSaleModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    const selectBox = document.getElementById('fs-book-select');
    selectBox.innerHTML = '<option value="">-- Chọn sách từ kho --</option>';
    window.allBooks.forEach(b => {
        selectBox.innerHTML += `<option value="${b.id}">${b.title} (${new Intl.NumberFormat('vi-VN').format(b.price)}đ)</option>`;
    });
    renderAdminFlashSaleList();
};

// 2. Hiển thị danh sách trong bảng Admin
window.renderAdminFlashSaleList = function() {
    const activeList = document.getElementById('fs-active-list');
    const fsBooks = window.allBooks.filter(b => b.flashSaleDiscount > 0);
    
    if(fsBooks.length === 0) {
        activeList.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">Chưa có sản phẩm nào đang chạy Flash Sale.</p>';
        return;
    }

    let html = '';
    fsBooks.forEach(b => {
        html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #eee; background: #fff;">
            <div>
                <strong style="color: #105b4d; font-size: 14px;">${b.title}</strong> 
                <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px; font-weight: bold;">-${b.flashSaleDiscount}%</span>
            </div>
            <button onclick="removeFromFlashSale('${b.id}')" style="background: #ccc; color: #333; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Gỡ bỏ</button>
        </div>`;
    });
    activeList.innerHTML = html;
};

// 3. Thêm sách vào Flash Sale lên Firebase
window.addToFlashSale = async function() {
    const bookId = document.getElementById('fs-book-select').value;
    const discount = Number(document.getElementById('fs-discount').value);
    
    if(!bookId) return alert("Vui lòng chọn 1 cuốn sách!");
    if(!discount || discount <= 0 || discount >= 100) return alert("Vui lòng nhập % giảm giá hợp lệ (từ 1 đến 99)!");

    await db.collection("books").doc(bookId).update({ flashSaleDiscount: discount });
    alert("Tuyệt vời! Đã đưa sách vào Flash Sale.");
    renderAdminFlashSaleList();
};

// 4. Gỡ sách khỏi Flash Sale
window.removeFromFlashSale = async function(id) {
    if(confirm("Bạn có chắc chắn muốn gỡ sách này khỏi chương trình Flash Sale?")) {
        // Xóa trường flashSaleDiscount trên Firebase
        await db.collection("books").doc(id).update({ flashSaleDiscount: firebase.firestore.FieldValue.delete() });
        renderAdminFlashSaleList();
    }
};

// 5. Hiển thị Flash Sale ra ngoài Trang chủ (Cho khách hàng xem)
window.renderFlashSaleFrontend = function() {
    const fsSection = document.getElementById('flash-sale-section');
    const fsGrid = document.getElementById('flash-sale-grid');
    if(!fsSection || !fsGrid) return; // Nếu đang ở trang khác không có ô này thì bỏ qua

    // ĐÂY LÀ ĐOẠN FIX: Nếu đang ở trang Danh sách (products) thì GIẤU CẢ KHỐI XANH ĐI
    const isProductsPage = window.location.pathname.includes('products');
    if (isProductsPage) {
        fsSection.style.display = 'none';
        return;
    }

    const fsBooks = window.allBooks.filter(b => b.flashSaleDiscount > 0);
    
    if(fsBooks.length === 0) {
        fsSection.style.display = 'none'; // Giấu đi nếu Admin chưa chọn sách nào
        return;
    }
    
    fsSection.style.display = 'block';
    let html = '';
    
    // Chỉ lấy 5 cuốn hiện ra ngoài màn hình cho gọn đẹp
    fsBooks.slice(0, 5).forEach(book => {
        const discountPercent = book.flashSaleDiscount;
        const finalPrice = book.price * (1 - discountPercent / 100);
        const oldPrice = book.price;

        const formatNewPrice = new Intl.NumberFormat('vi-VN').format(finalPrice) + 'đ';
        const formatOldPrice = new Intl.NumberFormat('vi-VN').format(oldPrice) + 'đ';
        const badgeHTML = `<div style="background: #e74c3c; color: white; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;">-${discountPercent}%</div>`;
        const imageUrl = book.image ? book.image : 'https://via.placeholder.com/250x300?text=Chưa+có+ảnh';
        const publisherName = book.publisher ? book.publisher.toUpperCase() : (book.category ? book.category.toUpperCase() : 'TYTBOOKS');

        html += `
            <div class="product-card" onclick="window.location.href='detail.html?id=${book.id}'" style="background: #fff; border-radius: 8px; padding: 15px; position: relative; cursor: pointer; transition: transform 0.3s; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column; height: 100%;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                
                <div style="position: relative; width: 100%; height: 180px; margin-bottom: 15px; border-radius: 4px; overflow: hidden;"
     onmouseover="this.querySelector('.qv-overlay').style.opacity='1'"
     onmouseout="this.querySelector('.qv-overlay').style.opacity='0'">
    <img src="${imageUrl}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: contain;">
    
    <div class="qv-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.4); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s; z-index: 5;">
        <div onclick="event.stopPropagation(); openQuickView('${book.id}')" style="background: #333; color: white; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: 0.2s;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='#105b4d';" onmouseout="this.style.transform='scale(1)'; this.style.background='#333';" title="Xem nhanh">
            <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        </div>
    </div>
</div>
                <div style="font-size: 11px; color: #999; margin-bottom: 5px; font-weight: bold;">${publisherName}</div>
                <h3 style="font-size: 14px; height: 40px; overflow: hidden; margin-bottom: 10px; color: #333; line-height: 1.4;">${book.title}</h3>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; flex: 1;">
                    <div style="display: flex; flex-direction: column;">
                        <span class="new-price" style="color: #d0021b; font-weight: bold; font-size: 16px; margin-bottom: 3px;">${formatNewPrice}</span>
                        <span style="color: #999; text-decoration: line-through; font-size: 12px; min-height: 15px;">${formatOldPrice}</span>
                    </div>
                    ${badgeHTML}
                </div>

                <div style="display: flex; gap: 12px; align-items: center;" onclick="event.stopPropagation();">
                    <button onclick="let qty = parseInt(document.getElementById('qty-${book.id}').innerText); alert('Đã thêm ' + qty + ' sản phẩm vào giỏ!'); if(typeof addToCart === 'function') { for(let i=0; i<qty; i++) { setTimeout(() => addToCart('${book.id}'), i*200); } }" style="background: #e74c3c; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.2s; flex-shrink: 0; box-shadow: 0 2px 4px rgba(231,76,60,0.3);" onmouseover="this.style.background='#c0392b'" onmouseout="this.style.background='#e74c3c'" title="Thêm vào giỏ">
                        
                        <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; fill: white;">
                            <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z"/>
                        </svg>

                    </button>

                    <div style="display: flex; align-items: center; border: 1px solid #ddd; border-radius: 20px; overflow: hidden; height: 32px; width: 95px; background: #fff;">
                        <button onclick="let q=document.getElementById('qty-${book.id}'); if(parseInt(q.innerText)>1) q.innerText=parseInt(q.innerText)-1;" style="background: transparent; border: none; width: 30px; font-size: 18px; color: #888; cursor: pointer; transition: 0.2s; padding: 0; line-height: 1;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#888'">-</button>
                        <span id="qty-${book.id}" style="flex: 1; text-align: center; font-size: 13px; font-weight: bold; color: #333;">1</span>
                        <button onclick="let q=document.getElementById('qty-${book.id}'); q.innerText=parseInt(q.innerText)+1;" style="background: transparent; border: none; width: 30px; font-size: 16px; color: #888; cursor: pointer; transition: 0.2s; padding: 0; line-height: 1;" onmouseover="this.style.color='#e74c3c'" onmouseout="this.style.color='#888'">+</button>
                    </div>
                </div>

            </div>
        `;
    });
    fsGrid.innerHTML = html;
};
// MẸO NHỎ MÀ CÓ VÕ LÀ ĐÂY:
// Khi Firebase báo có dữ liệu sách mới tải về (ở dòng 102), chúng ta yêu cầu nó chạy luôn hàm renderFlashSaleFrontend!
const originalRenderBooks = window.renderBooks;
window.renderBooks = function() {
    originalRenderBooks(); 
    renderFlashSaleFrontend(); // Tự động load Flash sale liên tục
};
// ==========================================
// XỬ LÝ: XEM NHANH SẢN PHẨM (QUICK VIEW)
// ==========================================
window.openQuickView = async function(bookId) {
    try {
        const doc = await db.collection("books").doc(bookId).get();
        if (doc.exists) {
            const book = doc.data();
            
            document.getElementById('qv-title').innerText = book.title;
            document.getElementById('qv-publisher').innerText = book.publisher || "TYTBOOKS";
            document.getElementById('qv-status').innerText = book.status || "Còn hàng";
            document.getElementById('qv-image').src = book.image || "https://via.placeholder.com/250";
            document.getElementById('qv-detail-link').href = 'detail.html?id=' + bookId;
            
            let finalPrice = book.price;
            let oldPrice = book.originalPrice || 0;
            let discountPercent = 0;

            if (book.flashSaleDiscount > 0) {
                discountPercent = book.flashSaleDiscount;
                finalPrice = book.price * (1 - discountPercent / 100);
                oldPrice = book.price; 
            } else if (oldPrice > finalPrice && finalPrice > 0) {
                discountPercent = Math.round((1 - finalPrice / oldPrice) * 100);
            }

            document.getElementById('qv-new-price').innerText = new Intl.NumberFormat('vi-VN').format(finalPrice) + 'đ';
            
            if (oldPrice > finalPrice) {
                document.getElementById('qv-old-price').innerText = new Intl.NumberFormat('vi-VN').format(oldPrice) + 'đ';
                document.getElementById('qv-discount-inline').innerText = `-${discountPercent}%`;
                document.getElementById('qv-discount-inline').style.display = 'inline-block';
                
                document.getElementById('qv-discount-text').innerText = `-${discountPercent}%`;
                document.getElementById('qv-discount-badge').style.display = 'flex';
            } else {
                document.getElementById('qv-old-price').innerText = '';
                document.getElementById('qv-discount-inline').style.display = 'none';
                document.getElementById('qv-discount-badge').style.display = 'none';
            }

            document.getElementById('qv-qty').innerText = "1"; // Reset số lượng
            
            // Lưu dữ liệu tạm để thêm vào giỏ
            window.currentQuickViewBook = {
                id: bookId,
                title: book.title,
                price: finalPrice,
                image: book.image || "https://via.placeholder.com/100"
            };

            // Hiển thị modal
            document.getElementById('quickViewModal').style.display = 'flex';
        }
    } catch (error) {
        console.error("Lỗi xem nhanh:", error);
    }
};

window.addToCartQuickView = function() {
    if(!window.currentQuickViewBook) return;
    const qty = parseInt(document.getElementById('qv-qty').innerText) || 1;
    
    let cart = JSON.parse(localStorage.getItem('tyt_cart')) || [];
    let existingItem = cart.find(item => item.id === window.currentQuickViewBook.id);
    
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        cart.push({
            id: window.currentQuickViewBook.id,
            title: window.currentQuickViewBook.title,
            price: window.currentQuickViewBook.price,
            image: window.currentQuickViewBook.image,
            quantity: qty
        });
    }
    localStorage.setItem('tyt_cart', JSON.stringify(cart));
    
    if(typeof updateHeaderCartOnHome === 'function') updateHeaderCartOnHome();
    
    alert(`Đã thêm ${qty} cuốn '${window.currentQuickViewBook.title}' vào giỏ hàng!`);
    document.getElementById('quickViewModal').style.display = 'none';
}