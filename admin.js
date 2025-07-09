// تكوين Firebase - استبدل بقيم مشروعك الحقيقي
const firebaseConfig = {
  apiKey: "AIzaSyYourApiKeyHere",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-database-url.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// عناصر واجهة المستخدم
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const adminPassInput = document.getElementById('admin-pass');
const ordersContainer = document.getElementById('orders');
const menuListContainer = document.getElementById('menu-list');
const newItemInput = document.getElementById('newItem');
const newPriceInput = document.getElementById('newPrice');

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
  // تعيين السنة الحالية في التذييل
  document.getElementById('admin-year').textContent = new Date().getFullYear();
  
  // إخفاء لوحة التحكم حتى تسجيل الدخول
  adminPanel.style.display = 'none';
  
  // محاولة تسجيل الدخول التلقائي إذا كان هناك جلسة موجودة
  checkAuthState();
});

// التحقق من حالة المصادقة
function checkAuthState() {
  auth.onAuthStateChanged(user => {
    if (user) {
      // المستخدم مسجل الدخول
      loginSection.style.display = 'none';
      adminPanel.style.display = 'block';
      loadData();
    } else {
      // لا يوجد مستخدم مسجل الدخول
      loginSection.style.display = 'block';
      adminPanel.style.display = 'none';
    }
  });
}

// تسجيل الدخول
async function login() {
  const email = "admin@example.com"; // يمكنك تغيير هذا أو جعله حقل إدخال
  const password = adminPassInput.value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    // تسجيل الدخول ناجح
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    loadData();
  } catch (error) {
    handleAuthError(error);
  }
}

// معالجة أخطاء المصادقة
function handleAuthError(error) {
  let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
  
  switch (error.code) {
    case "auth/wrong-password":
      errorMessage = "كلمة المرور غير صحيحة";
      break;
    case "auth/user-not-found":
      errorMessage = "الحساب غير موجود";
      break;
    case "auth/invalid-email":
      errorMessage = "بريد إلكتروني غير صالح";
      break;
    case "auth/too-many-requests":
      errorMessage = "محاولات كثيرة جداً، حاول لاحقاً";
      break;
  }
  
  alert(errorMessage);
  adminPassInput.value = '';
  adminPassInput.focus();
}

// تسجيل الخروج (يمكن إضافة زر لهذه الوظيفة)
function logout() {
  auth.signOut().then(() => {
    loginSection.style.display = 'block';
    adminPanel.style.display = 'none';
  });
}

// تحميل البيانات
function loadData() {
  loadOrders();
  loadMenuList();
}

// تحميل الطلبات
function loadOrders() {
  db.ref("orders").orderByChild("timestamp").on("value", snapshot => {
    ordersContainer.innerHTML = '';
    const orders = snapshot.val();
    
    if (!orders) {
      ordersContainer.innerHTML = '<div class="empty-state">لا توجد طلبات حالياً</div>';
      return;
    }
    
    // تحويل إلى مصفوفة وعكس الترتيب لعرض الأحدث أولاً
    const ordersArray = Object.entries(orders).reverse();
    
    ordersArray.forEach(([key, order]) => {
      const orderElement = createOrderElement(key, order);
      ordersContainer.appendChild(orderElement);
    });
  });
}

// إنشاء عنصر طلب
function createOrderElement(key, order) {
  const orderElement = document.createElement('div');
  orderElement.className = 'order-card';
  
  let itemsHTML = '';
  let totalPrice = 0;
  
  order.items.forEach(item => {
    const itemPrice = parseFloat(item.price) * parseInt(item.qty);
    totalPrice += itemPrice;
    
    itemsHTML += `
      <div class="order-item">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <span>${item.qty} × ${item.price} جنيه</span>
          <span class="item-total">${itemPrice.toFixed(2)} جنيه</span>
        </div>
        ${item.note ? `<div class="item-note">ملاحظات: ${item.note}</div>` : ''}
      </div>
    `;
  });
  
  orderElement.innerHTML = `
    <div class="order-header">
      <h3><i class="fas fa-table"></i> الطاولة: ${order.table}</h3>
      <div class="order-time">${formatTime(order.timestamp)}</div>
    </div>
    <div class="order-items">${itemsHTML}</div>
    <div class="order-footer">
      <div class="order-total">المجموع: ${totalPrice.toFixed(2)} جنيه</div>
      <button onclick="deleteOrder('${key}')" class="btn-delete">
        <i class="fas fa-trash"></i> حذف الطلب
      </button>
    </div>
  `;
  
  return orderElement;
}

// تحميل قائمة الطعام
function loadMenuList() {
  db.ref("menu").on("value", snapshot => {
    menuListContainer.innerHTML = '';
    const menuItems = snapshot.val();
    
    if (!menuItems) {
      menuListContainer.innerHTML = '<div class="empty-state">لا توجد أصناف في القائمة</div>';
      return;
    }
    
    for (const [key, item] of Object.entries(menuItems)) {
      const menuItemElement = createMenuItemElement(key, item);
      menuListContainer.appendChild(menuItemElement);
    }
  });
}

// إنشاء عنصر قائمة طعام
function createMenuItemElement(key, item) {
  const menuItemElement = document.createElement('div');
  menuItemElement.className = 'menu-list-item';
  
  menuItemElement.innerHTML = `
    <div class="menu-item-info">
      <div class="menu-item-name">${item.name}</div>
      <div class="menu-item-price">${parseFloat(item.price).toFixed(2)} جنيه</div>
    </div>
    <div class="menu-item-actions">
      <button onclick="editMenuItem('${key}')" class="btn-edit">
        <i class="fas fa-edit"></i> تعديل
      </button>
      <button onclick="deleteMenuItem('${key}')" class="btn-delete">
        <i class="fas fa-trash"></i> حذف
      </button>
    </div>
  `;
  
  return menuItemElement;
}

// إضافة صنف جديد
async function addMenuItem() {
  const name = newItemInput.value.trim();
  const price = newPriceInput.value.trim();
  
  if (!name || !price) {
    alert("الرجاء إدخال اسم الصنف والسعر");
    return;
  }
  
  if (isNaN(price) || parseFloat(price) <= 0) {
    alert("السعر يجب أن يكون رقماً أكبر من الصفر");
    newPriceInput.focus();
    return;
  }
  
  try {
    await db.ref("menu").push({
      name: name,
      price: parseFloat(price).toFixed(2)
    });
    
    newItemInput.value = '';
    newPriceInput.value = '';
    newItemInput.focus();
    
    alert("تمت إضافة الصنف بنجاح");
  } catch (error) {
    alert("حدث خطأ أثناء إضافة الصنف: " + error.message);
  }
}

// تعديل صنف (وظيفة مساعدة)
function editMenuItem(key) {
  const newName = prompt("أدخل الاسم الجديد:");
  if (!newName) return;
  
  const newPrice = prompt("أدخل السعر الجديد:");
  if (!newPrice || isNaN(newPrice)) {
    alert("السعر يجب أن يكون رقماً");
    return;
  }
  
  db.ref(`menu/${key}`).update({
    name: newName,
    price: parseFloat(newPrice).toFixed(2)
  }).then(() => {
    alert("تم التعديل بنجاح");
  }).catch(error => {
    alert("حدث خطأ أثناء التعديل: " + error.message);
  });
}

// حذف صنف
function deleteMenuItem(key) {
  if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
    db.ref(`menu/${key}`).remove()
      .then(() => alert("تم الحذف بنجاح"))
      .catch(error => alert("حدث خطأ أثناء الحذف: " + error.message));
  }
}

// حذف طلب
function deleteOrder(key) {
  if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
    db.ref(`orders/${key}`).remove()
      .then(() => alert("تم حذف الطلب بنجاح"))
      .catch(error => alert("حدث خطأ أثناء حذف الطلب: " + error.message));
  }
}

// تنسيق الوقت
function formatTime(timestamp) {
  if (!timestamp) return 'غير معروف';
  
  const date = new Date(timestamp);
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// تصدير الدوال للوصول إليها من HTML
window.login = login;
window.addMenuItem = addMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.deleteOrder = deleteOrder;
window.editMenuItem = editMenuItem;
