// Dán cấu hình Firebase của bạn vào đây (giống hệt file login)
const firebaseConfig = {
  apiKey: "AIzaSyDQfG3g1pj6bD0szhu-dmULZW0uixtK75c",
  authDomain: "tyt-computer.firebaseapp.com",
  projectId: "tyt-computer",
  storageBucket: "tyt-computer.firebasestorage.app",
  messagingSenderId: "1089729178824",
  appId: "1:1089729178824:web:bb86d1ceb8386b8a9509fd"
};

// Khởi tạo Firebase và Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Bắt sự kiện thêm sách
document.getElementById('addBookForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Lấy dữ liệu từ TẤT CẢ các ô input
    const title = document.getElementById('bookTitle').value;
    const author = document.getElementById('bookAuthor').value;
    const price = document.getElementById('bookPrice').value;
    const originalPrice = document.getElementById('bookOriginalPrice').value;
    const publisher = document.getElementById('bookPublisher').value;
    const pages = document.getElementById('bookPages').value;
    const imageUrl = document.getElementById('bookImage').value;
    const description = document.getElementById('bookDescription').value;

    // Đẩy toàn bộ dữ liệu lên Firebase Firestore
    db.collection("books").add({
        title: title,
        author: author,
        price: Number(price),
        originalPrice: Number(originalPrice), // Lưu thêm giá gốc
        publisher: publisher,
        pages: Number(pages),
        image: imageUrl,
        description: description, // Lưu bài viết mô tả
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        document.getElementById('statusMsg').innerText = "Thêm sách thành công!";
        document.getElementById('statusMsg').style.color = "green";
        document.getElementById('addBookForm').reset(); // Xóa trắng form sau khi đăng
    })
    .catch((error) => {
        console.error("Lỗi: ", error);
        document.getElementById('statusMsg').innerText = "Có lỗi xảy ra, vui lòng thử lại.";
        document.getElementById('statusMsg').style.color = "red";
    });
});