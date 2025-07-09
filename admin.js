const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Set current year in footer
document.getElementById('admin-year').textContent = new Date().getFullYear();

function login() {
  const pass = document.getElementById("admin-pass").value;
  if (pass === "4321") {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadOrders();
    loadMenuList();
  } else {
    alert("كلمة المرور غير صحيحة");
    document.getElementById("admin-pass").value = "";
    document.getElementById("admin-pass").focus();
  }
}

function addMenuItem() {
  const name = document.getElementById('newItem').value.trim();
  const price = document.getElementById('newPrice').value;
  
  if (!name || !price) {
    alert("الرجاء إدخال اسم الصنف والسعر");
    return;
  }
  
  if (isNaN(price) {
    alert("السعر يجب أن يكون رقماً");
    return;
  }
  
  db.ref("menu").push({ 
    name: name, 
    price: parseFloat(price).toFixed(2)
  });
  
  document.getElementById('newItem').value = '';
  document.getElementById('newPrice').value = '';
  document.getElementById('newItem').focus();
}

function loadOrders() {
  db.ref("orders").orderByChild("timestamp").on("value", snapshot => {
    const ordersDiv = document.getElementById('orders');
    ordersDiv.innerHTML = '';
    const orders = snapshot.val();
    
    if (!orders || Object.keys(orders).length === 0) {
      ordersDiv.innerHTML = '<p class="empty-message">لا توجد طلبات حالياً</p>';
      return;
    }
    
    // Convert to array and reverse to show latest first
    const ordersArray = Object.entries(orders).reverse();
    
    ordersArray.forEach(([key, order]) => {
      let html = `
        <div class="order-card">
          <h3><i class="fas fa-table"></i> الطاولة: ${order.table}</h3>
          <div class="order-time">${formatTime(order.timestamp)}</div>
          <div class="order-items">
      `;
      
      order.items.forEach(item => {
        const total = item.price * item.qty;
        html += `
          <div class="order-item">
            <strong>${item.name}</strong><br>
            الكمية: ${item.qty} - السعر: ${total.toFixed(2)} جنيه<br>
            ${item.note ? '<small>ملاحظات: ' + item.note + '</small>' : ''}
          </div>
        `;
      });
      
      html += `
          </div>
          <button onclick="deleteOrder('${key}')" class="delete-btn">
            <i class="fas fa-trash"></i> حذف الطلب
          </button>
        </div>
      `;
      
      ordersDiv.innerHTML += html;
    });
  });
}

function loadMenuList() {
  db.ref("menu").on("value", snapshot => {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = '';
    const items = snapshot.val();
    
    if (!items || Object.keys(items).length === 0) {
      menuList.innerHTML = '<p class="empty-message">لا توجد أصناف في القائمة</p>';
      return;
    }
    
    for (let key in items) {
      const item = items[key];
      menuList.innerHTML += `
        <div class="menu-list-item">
          <div>
            <strong>${item.name}</strong><br>
            <small>${item.price} جنيه</small>
          </div>
          <button onclick="deleteItem('${key}')" class="delete-btn">
            <i class="fas fa-trash"></i> حذف
          </button>
        </div>
      `;
    }
  });
}

function deleteItem(key) {
  if (confirm("هل أنت متأكد من حذف هذا الصنف؟")) {
    db.ref("menu/" + key).remove();
  }
}

function deleteOrder(key) {
  if (confirm("هل أنت متأكد من حذف هذا الطلب؟")) {
    db.ref("orders/" + key).remove();
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('ar-EG');
}
