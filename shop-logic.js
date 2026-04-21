// 1. Dán Cấu hình Firebase của dự án TYTBOOKS vào đây
// LƯU Ý: Bạn cần lấy đúng config của dự án tytbooks-b83b0 trong cài đặt Firebase
// --- ĐOẠN CODE THÊM: TỰ ĐỘNG ĐẾM SỐ LƯỢNG GIỎ HÀNG CHO TRANG CHỦ ---
function updateHeaderCartOnHome() {
    let cart = JSON.parse(localStorage.getItem('tyt_cart')) || [];
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartText = document.getElementById('cart-count-text');
    if(cartText) cartText.innerText = totalItems + " sản phẩm";
}
updateHeaderCartOnHome();
// -------------------------------------------------------------------
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

// -------------------------------------------------------------------
// PHẦN 1: XỬ LÝ ĐÓNG/MỞ POPUP (MODAL) THÊM SÁCH
// -------------------------------------------------------------------
const modal = document.getElementById("addBookModal");
const btnOpen = document.getElementById("btnOpenModal");
const btnClose = document.getElementById("btnCloseModal");

// Mở Popup khi bấm nút "+ Đăng Sách Nhanh"
btnOpen.onclick = function() {
    modal.style.display = "block";
    document.getElementById('statusMsg').innerText = ""; // Xóa thông báo cũ
}

// Đóng Popup khi bấm dấu X
btnClose.onclick = function() {
    modal.style.display = "none";
}

// Đóng Popup khi click chuột ra ngoài vùng nền đen
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// -------------------------------------------------------------------
// PHẦN 2: LƯU SÁCH CÓ THÊM PHẦN DANH MỤC VÀ TÌNH TRẠNG
// -------------------------------------------------------------------
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btnSubmitForm');
    btnSubmit.innerText = "ĐANG TẢI LÊN..."; btnSubmit.disabled = true;

    db.collection("books").add({
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        category: document.getElementById('bookCategory').value, 
        status: document.getElementById('book-status').value, // <--- THÊM DÒNG NÀY: Lưu tình trạng khi đăng sách
        price: Number(document.getElementById('bookPrice').value),
        originalPrice: Number(document.getElementById('bookOriginalPrice').value),
        publisher: document.getElementById('bookPublisher').value,
        pages: Number(document.getElementById('bookPages').value),
        image: document.getElementById('bookImage').value,
        description: document.getElementById('bookDescription').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() 
    })
    .then(() => {
        document.getElementById('statusMsg').innerText = "✅ Thêm sách thành công!";
        document.getElementById('statusMsg').style.color = "green";
        document.getElementById('addBookForm').reset(); 
        setTimeout(() => { modal.style.display = "none"; }, 1500);
    })
    .catch((error) => { /*...giữ nguyên phần báo lỗi...*/ })
    .finally(() => { btnSubmit.innerText = "ĐĂNG SẢN PHẨM"; btnSubmit.disabled = false; });
});

// -------------------------------------------------------------------
// PHẦN 3: HIỂN THỊ VÀ LỌC SẢN PHẨM THEO DANH MỤC
// -------------------------------------------------------------------
const bookGrid = document.getElementById('book-grid');
let allBooks = []; // Mảng chứa tất cả sách
let currentFilter = 'all'; // Mặc định hiển thị tất cả

// Lấy dữ liệu 1 lần từ Firebase
db.collection("books").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
    allBooks = []; // Reset mảng mỗi khi có dữ liệu mới
    querySnapshot.forEach((doc) => {
        allBooks.push({ id: doc.id, ...doc.data() });
    });
    renderBooks(); // Gọi hàm in sách ra màn hình
});

// Hàm vẽ sách ra giao diện (Có lọc)
function renderBooks() {
    bookGrid.innerHTML = ''; 

    // Lọc sách theo currentFilter
const filteredBooks = currentFilter === 'all' 
        ? allBooks 
        : allBooks.filter(book => book.category === currentFilter);

    // Đổi tên Tiêu đề theo danh mục
    const sectionTitle = document.querySelector('.section-title h2');
    if(currentFilter === 'all') sectionTitle.innerText = 'TẤT CẢ SẢN PHẨM';
    else if(currentFilter === 'Sách') sectionTitle.innerText = 'SÁCH - TRUYỆN TRANH';
    else sectionTitle.innerText = currentFilter.toUpperCase();

    // Nếu không có sách nào
    if (filteredBooks.length === 0) {
        bookGrid.innerHTML = `<p style="grid-column: span 4; text-align: center; color: #d9534f; padding: 40px;">Chưa có sản phẩm nào trong danh mục này.</p>`;
        return;
    }

    // In danh sách đã lọc ra
    filteredBooks.forEach((book) => {
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
        const imageUrl = book.image ? book.image : 'https://via.placeholder.com/250x300?text=Chưa+có+ảnh';

      const productHTML = `
            <div class="product-card" onclick="window.location.href='detail.html?id=${book.id}'">
                <button class="btn-delete" onclick="event.stopPropagation(); deleteBook('${book.id}')">✕</button>
                
                <button class="btn-edit-item" onclick="event.stopPropagation(); openEditModal('${book.id}')">✎</button>

                <img src="${imageUrl}" alt="${book.title}" style="width: 100%; height: 180px; object-fit: contain; margin-bottom: 10px;">
                <h3 class="product-name">${book.title}</h3>
                <div class="product-price"><span class="new-price">${formattedPrice}</span></div>
            </div>
        `;
        bookGrid.innerHTML += productHTML;
    });
}

// -------------------------------------------------------------------
// PHẦN 4: HÀM NHẬN LỆNH KHI BẤM VÀO MENU (Được gọi từ HTML)
// -------------------------------------------------------------------
window.filterCategory = function(event, categoryName) {
    event.preventDefault(); // Ngăn web bị nhảy vút lên đầu trang khi bấm
    currentFilter = categoryName; // Đổi điều kiện lọc
    renderBooks(); // Vẽ lại giao diện
}
// -------------------------------------------------------------------
// PHẦN 5: HÀM XÓA SÁCH
// -------------------------------------------------------------------
window.deleteBook = function(event, bookId) {
    // Lệnh này CỰC KỲ QUAN TRỌNG: Ngăn không cho sự kiện click lan ra thẻ div bên ngoài
    // (Nếu không có lệnh này, khi bấm xóa web sẽ bị nhảy sang trang Chi tiết sản phẩm)
    event.stopPropagation(); 

    // Hiện hộp thoại xác nhận trước khi xóa thật
    const isConfirm = confirm("Bạn có chắc chắn muốn xóa cuốn sách này không? Dữ liệu không thể khôi phục.");
    
    if (isConfirm) {
        // Gọi lệnh xóa của Firebase
        db.collection("books").doc(bookId).delete().then(() => {
            alert("Đã xóa sách thành công!");
            // Vì chúng ta đang dùng onSnapshot (Realtime), nên không cần viết code tải lại giao diện.
            // Sách sẽ tự động biến mất ngay lập tức!
        }).catch((error) => {
            console.error("Lỗi khi xóa: ", error);
            alert("Lỗi: Không thể xóa sách.");
        });
    }
}

// ==========================================
// PHẦN THÊM: CHỨC NĂNG ĐĂNG NHẬP / ĐĂNG KÝ
// ==========================================
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
const facebookProvider = new firebase.auth.FacebookAuthProvider();

// Đổi giao diện Popup
window.showLoginForm = function() {
    document.getElementById('auth-title').innerText = 'Đăng nhập';
    document.getElementById('auth-separator-text').innerText = 'hoặc đăng nhập dùng email';
    document.getElementById('login-form-area').style.display = 'block';
    document.getElementById('register-form-area').style.display = 'none';
};

window.showRegisterForm = function() {
    document.getElementById('auth-title').innerText = 'Đăng ký';
    document.getElementById('auth-separator-text').innerText = 'hoặc đăng ký dùng email';
    document.getElementById('login-form-area').style.display = 'none';
    document.getElementById('register-form-area').style.display = 'block';
};

// Kết nối Google / Facebook / Email
window.loginWithGoogle = function() {
    auth.signInWithPopup(googleProvider).then(() => {
        document.getElementById('authModal').style.display = 'none';
    }).catch(error => alert('Lỗi: ' + error.message));
};

window.loginWithFacebook = function() {
    auth.signInWithPopup(facebookProvider).then(() => {
        document.getElementById('authModal').style.display = 'none';
    }).catch(error => alert('Lỗi: ' + error.message));
};
window.loginWithEmail = function() {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, pass).then(() => {
        document.getElementById('authModal').style.display = 'none';
    }).catch(error => alert('Lỗi đăng nhập: Vui lòng kiểm tra lại Email/Mật khẩu.'));
};

window.registerWithEmail = function() {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const name = document.getElementById('reg-name').value;
    auth.createUserWithEmailAndPassword(email, pass).then(userCredential => {
        return userCredential.user.updateProfile({ displayName: name });
    }).then(() => {
        document.getElementById('authModal').style.display = 'none';
    }).catch(error => alert('Lỗi đăng ký: ' + error.message));
};

window.logoutUser = function() {
    auth.signOut();
};

// Tự động đổi thanh Top-bar khi đăng nhập thành công
auth.onAuthStateChanged(user => {
    const greeting = document.getElementById('user-greeting');
    const btnLogin = document.getElementById('btn-show-login');
    const btnRegister = document.getElementById('btn-show-register');
    const btnLogout = document.getElementById('btn-logout');
    
    if (user) { // Đã đăng nhập
        greeting.style.display = 'inline';
        greeting.innerText = 'Xin chào, ' + (user.displayName || user.email);
        btnLogin.style.display = 'none';
        btnRegister.style.display = 'none';
        btnLogout.style.display = 'inline';
    } else { // Chưa đăng nhập
        greeting.style.display = 'none';
        btnLogin.style.display = 'inline';
        btnRegister.style.display = 'inline';
        btnLogout.style.display = 'none';
    }
});
// ==========================================
// PHẦN THÊM: PHÂN QUYỀN ADMIN (GIẤU NÚT)
// ==========================================

// Hàm kiểm tra và ẩn/hiện nút
function checkAdminPrivileges(user) {
   // Thay thế nội dung trong hàm checkAdminPrivileges cũ bằng đoạn này:
    const btnAddBook = document.getElementById('btnOpenModal');
    const btnViewOrders = document.getElementById('btnViewOrders'); // Bổ sung
    const deleteButtons = document.querySelectorAll('.btn-delete');
    const editButtons = document.querySelectorAll('.btn-edit-item');

    const adminEmail = 'lethihatrang3105@gmail.com'; 

    if (user && user.email === adminEmail) {
        if (btnAddBook) btnAddBook.style.display = 'block';
        if (btnViewOrders) btnViewOrders.style.display = 'block'; // Admin thấy nút
        deleteButtons.forEach(btn => btn.style.display = 'flex');
        editButtons.forEach(btn => btn.style.display = 'flex'); 
    } else {
        if (btnAddBook) btnAddBook.style.display = 'none';
        if (btnViewOrders) btnViewOrders.style.display = 'none'; // Khách không thấy
        deleteButtons.forEach(btn => btn.style.display = 'none');
        editButtons.forEach(btn => btn.style.display = 'none');
    }
}

// Lắng nghe trạng thái đăng nhập để thực hiện ẩn/hiện ngay lập tức
auth.onAuthStateChanged(user => {
    // Chạy kiểm tra mỗi khi trạng thái đăng nhập thay đổi
    checkAdminPrivileges(user);
});

// Vì các nút xóa được tạo ra sau khi tải dữ liệu từ Firebase, 
// chúng ta cần chạy lại kiểm tra này sau khi danh sách sách đã hiện ra.
// Sửa lại đoạn onSnapshot một chút để gọi hàm này:
db.collection("books").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
    window.allBooks = []; // <--- THÊM DÒNG NÀY (Để xóa dữ liệu cũ mỗi khi cập nhật)
    const bookGrid = document.getElementById('book-grid');
    bookGrid.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const book = doc.data();
        book.id = doc.id;
        window.allBooks.push(book); // <--- THÊM DÒNG NÀY (Để lưu sách vào bộ nhớ tìm kiếm)
        
        // ... (Giữ nguyên đoạn code render giao diện cũ của bạn bên dưới)
    });
    
    // Sau khi tải xong, nếu đang có từ khóa tìm kiếm thì lọc luôn
    if (typeof executeSearch === 'function') executeSearch(); 
});
// ==========================================
// BỘ LỌC TÌM KIẾM CHUẨN (DÀNH CHO TYTBOOKS)
// ==========================================
window.executeSearch = function() {
    // 1. Lấy ô nhập liệu và từ khóa (Xử lý cả chữ hoa/thường)
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;
    const keyword = searchInput.value.trim().toLowerCase();
    
    const bookGrid = document.getElementById('book-grid');
    if (!bookGrid || !window.allBooks) return;

    // 2. Lọc danh sách sách
    const filteredBooks = window.allBooks.filter(book => {
        const title = (book.title || "").toLowerCase();
        return title.includes(keyword);
    });

    // 3. Cập nhật tiêu đề (TẤT CẢ SẢN PHẨM -> KẾT QUẢ TÌM KIẾM)
    const titleSection = document.querySelector('.section-title h2');
    if (titleSection) {
        titleSection.innerText = keyword === "" ? "TẤT CẢ SẢN PHẨM" : "KẾT QUẢ TÌM KIẾM CHO: '" + keyword.toUpperCase() + "'";
    }

    // 4. Vẽ lại lưới sản phẩm chỉ với những cuốn khớp từ khóa
    bookGrid.innerHTML = '';
    
    if (filteredBooks.length === 0) {
        bookGrid.innerHTML = `<p style="grid-column: span 4; text-align: center; padding: 50px; color: #d9534f; font-weight: bold;">Rất tiếc, không tìm thấy sách: "${keyword}"</p>`;
        return;
    }

    filteredBooks.forEach(book => {
        const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price);
        const imageUrl = book.image || 'https://via.placeholder.com/250x300';
        
        // Vẽ lại thẻ sản phẩm (Giữ nguyên cấu trúc bạn đang có)
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => window.location.href = `detail.html?id=${book.id}`;
        card.innerHTML = `
            <button class="btn-delete" onclick="event.stopPropagation(); deleteBook('${book.id}')">✕</button>
            <img src="${imageUrl}" alt="${book.title}">
            <h3 class="product-name">${book.title}</h3>
            <div class="product-price"><span class="new-price">${formattedPrice}</span></div>
        `;
        bookGrid.appendChild(card);
    });
};

// Gắn sự kiện: Gõ chữ đến đâu lọc đến đó + Bấm nút kính lúp
document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.search-bar input');
    const btn = document.querySelector('.search-bar button');

    if (input) {
        input.addEventListener('input', window.executeSearch); // Tìm kiếm ngay khi đang gõ
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.executeSearch();
        });
    }
    if (btn) btn.addEventListener('click', window.executeSearch);
});
// ==========================================
// HÀM XỬ LÝ XÓA SÁCH TRÊN FIREBASE
// ==========================================
window.deleteBook = function(id) {
    // 1. Hiện thông báo xác nhận để tránh bấm nhầm
    if (confirm("Bạn có chắc chắn muốn xóa cuốn sách này không? Hành động này không thể hoàn tác!")) {
        
        // 2. Gọi lệnh xóa lên Firebase Firestore
        db.collection("books").doc(id).delete()
        .then(() => {
            // Xóa thành công, thông báo cho người dùng
            alert("Đã xóa sách khỏi hệ thống thành công!");
            
            // Lưu ý: Vì bạn đang dùng .onSnapshot, trang web sẽ tự động 
            // cập nhật lại lưới sản phẩm mà không cần bạn phải F5.
        })
        .catch((error) => {
            console.error("Lỗi khi xóa sách: ", error);
            alert("Không thể xóa sách. Có thể do lỗi kết nối hoặc quyền hạn!");
        });
    }
};

// --- LOGIC SỬA SÁCH (CHỈ THÊM) ---

// 1. Hàm lấy dữ liệu cũ và hiện modal
window.openEditModal = function(id) {
    db.collection("books").doc(id).get().then((doc) => {
        if (doc.exists) {
            const book = doc.data();
            document.getElementById('edit-book-id').value = id;
            document.getElementById('edit-book-title').value = book.title || "";
            document.getElementById('edit-book-author').value = book.author || "";
            document.getElementById('edit-book-price').value = book.price || 0;
            document.getElementById('edit-book-category').value = book.category || "";
            document.getElementById('edit-book-status').value = book.status || "Còn hàng"; // <--- THÊM DÒNG NÀY: Lấy tình trạng cũ
            document.getElementById('edit-book-image').value = book.image || "";
            document.getElementById('edit-book-description').value = book.description || "";
            
            document.getElementById('editBookModal').style.display = 'block';
        }
    });
};

// 2. Hàm lưu dữ liệu mới lên Firebase
window.updateBookInFirebase = function() {
    const id = document.getElementById('edit-book-id').value;
    const newData = {
        title: document.getElementById('edit-book-title').value,
        author: document.getElementById('edit-book-author').value,
        price: Number(document.getElementById('edit-book-price').value),
        category: document.getElementById('edit-book-category').value,
        status: document.getElementById('edit-book-status').value, // <--- THÊM DÒNG NÀY: Lưu lại tình trạng mới
        image: document.getElementById('edit-book-image').value,
        description: document.getElementById('edit-book-description').value
    };

    db.collection("books").doc(id).update(newData).then(() => {
        alert("Cập nhật thành công!");
        document.getElementById('editBookModal').style.display = 'none';
    }).catch(err => alert("Lỗi: " + err));
};
// ==========================================
// HỆ THỐNG QUẢN LÝ ĐƠN HÀNG (CHỈ ADMIN)
// ==========================================
window.openOrderManager = function() {
    document.getElementById('orderManagerModal').style.display = 'block';
    const orderListDiv = document.getElementById('admin-orders-list');
    orderListDiv.innerHTML = '<p style="text-align: center; color: #666;">Đang tải dữ liệu...</p>';

    // Kéo đơn hàng mới nhất về
    db.collection("orders").orderBy("createdAt", "desc").get().then((snapshot) => {
        orderListDiv.innerHTML = '';
        if (snapshot.empty) {
            orderListDiv.innerHTML = '<p style="text-align:center; color:red;">Chưa có đơn hàng nào.</p>';
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const orderId = doc.id;
            
            // Xử lý ngày giờ
            let dateStr = "Chưa rõ thời gian";
            if (order.createdAt) {
                const dateObj = order.createdAt.toDate();
                dateStr = dateObj.toLocaleDateString('vi-VN') + " " + dateObj.toLocaleTimeString('vi-VN');
            }

            // Xử lý danh sách sách khách mua
            let itemsHTML = '';
            (order.items || []).forEach(item => {
                itemsHTML += `<li>- ${item.quantity || 1} x <strong>${item.title}</strong></li>`;
            });

            // Tổng tiền
            const formatPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || 0);
            
            // Màu sắc trạng thái
            let statusColor = order.status === "Đã giao" ? "green" : "#f26522";

            const orderCard = `
                <div style="border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin-bottom: 15px; background: #fafafa; position: relative;">
                    <div style="display:flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                        <span style="font-size: 13px; color: #666;">Ngày đặt: <strong>${dateStr}</strong></span>
                        <span style="font-size: 13px; font-weight: bold; color: ${statusColor}; background: #fff; padding: 2px 8px; border: 1px solid ${statusColor}; border-radius: 12px;">${order.status}</span>
                    </div>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1; border-right: 1px solid #eee;">
                            <p style="margin-bottom: 5px;">👤 Khách: <strong>${order.customerName}</strong></p>
                            <p style="margin-bottom: 5px;">📞 SĐT: <strong>${order.customerPhone}</strong></p>
                            <p style="margin-bottom: 5px; font-size: 13px;">📍 Đ/c: ${order.customerAddress}</p>
                            <p style="margin-bottom: 5px; font-size: 13px; color:#888;">📝 Ghi chú: ${order.note || 'Không có'}</p>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-weight: bold; margin-bottom: 5px;">Sản phẩm đặt mua:</p>
                            <ul style="list-style: none; padding: 0; font-size: 13px; margin-bottom: 10px;">
                                ${itemsHTML}
                            </ul>
                            <p style="font-size: 16px;">Tổng tiền: <strong style="color: #d9534f;">${formatPrice}</strong></p>
                            
                            <div style="margin-top: 15px;">
                                <button onclick="markOrderDone('${orderId}')" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">✔ Đánh dấu Đã giao</button>
                                <button onclick="deleteOrder('${orderId}')" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-left: 5px;">🗑 Hủy đơn</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            orderListDiv.innerHTML += orderCard;
        });
    }).catch(err => {
        orderListDiv.innerHTML = '<p style="color:red;">Lỗi tải dữ liệu: ' + err.message + '</p>';
    });
};

// Hàm cập nhật trạng thái thành Đã Giao
window.markOrderDone = function(orderId) {
    if(confirm("Xác nhận đơn hàng này ĐÃ GIAO thành công?")) {
        db.collection("orders").doc(orderId).update({ status: "Đã giao" }).then(() => {
            alert("Đã cập nhật trạng thái!");
            openOrderManager(); // Tải lại danh sách
        });
    }
};

// Hàm xóa đơn hàng
window.deleteOrder = function(orderId) {
    if(confirm("Bạn có chắc chắn muốn XÓA/HỦY đơn hàng này? Khách hàng sẽ buồn đó nha!")) {
        db.collection("orders").doc(orderId).delete().then(() => {
            alert("Đã xóa đơn hàng.");
            openOrderManager(); // Tải lại danh sách
        });
    }
};
// ĐOẠN CODE THÊM VÀO CUỐI CÙNG: ĐẢM BẢO ẨN NÚT XÓA VÀ SỬA VỚI KHÁCH HÀNG
db.collection("books").onSnapshot(() => {
    setTimeout(() => {
        const user = firebase.auth().currentUser;
        // Kiểm tra nếu chưa đăng nhập, hoặc email không phải Admin thì ẩn nút đi
        if (!user || user.email !== 'lethihatrang3105@gmail.com') {
            document.querySelectorAll('.btn-delete, .btn-edit-item').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }, 300); // Chờ 0.3 giây sau khi tải xong sách để giấu nút
});