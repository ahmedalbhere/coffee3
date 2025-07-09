const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentTable = null;

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

function enterTable() {
  const table = document.getElementById('tableNumber').value;
  if (table) {
    currentTable = table;
    document.getElementById('table-input').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
    loadMenu();
  } else {
    alert("الرجاء إدخال رقم الطاولة");
  }
}

function loadMenu() {
  db.ref("menu").on("value", snapshot => {
    const itemsDiv = document.getElementById('menu-items');
    itemsDiv.innerHTML = '';
    const items = snapshot.val();
    
    if (!items || Object.keys(items).length === 0) {
      itemsDiv.innerHTML = '<p class="empty-message">لا توجد أصناف متاحة حالياً</p>';
      return;
    }
    
    for (let key in items) {
      const item = items[key];
      itemsDiv.innerHTML += `
        <div class="menu-item">
          <h3>${item.name}</h3>
          <div class="price">${item.price} جنيه</div>
          <div class="item-controls">
            <input type="number" id="qty-${key}" placeholder="الكمية" min="1" value="1">
            <textarea id="note-${key}" placeholder="ملاحظات خاصة"></textarea>
          </div>
        </div>
      `;
    }
  });
}

function submitOrder() {
  const order = { 
    table: currentTable, 
    items: [],
    timestamp: firebase.database.ServerValue.TIMESTAMP
  };
  
  db.ref("menu").once("value").then(snapshot => {
    const items = snapshot.val();
    let hasItems = false;
    
    for (let key in items) {
      const qty = document.getElementById(`qty-${key}`).value;
      const note = document.getElementById(`note-${key}`).value;
      if (qty && qty > 0) {
        hasItems = true;
        order.items.push({
          name: items[key].name,
          price: items[key].price,
          qty: qty,
          note: note
        });
      }
    }
    
    if (!hasItems) {
      alert("الرجاء إدخال كمية لعنصر واحد على الأقل");
      return;
    }
    
    db.ref("orders").push(order);
    showOrderSummary(order);
  });
}

function showOrderSummary(order) {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('summary-table').textContent = order.table;
  
  const itemsDiv = document.getElementById('summary-items');
  itemsDiv.innerHTML = '<strong>الطلبات:</strong><br>';
  
  order.items.forEach(item => {
    itemsDiv.innerHTML += `
      ${item.name} (${item.qty}) - ${item.price * item.qty} جنيه<br>
      ${item.note ? '<small>ملاحظات: ' + item.note + '</small><br>' : ''}
    `;
  });
  
  document.getElementById('order-summary').style.display = 'block';
}

function goBack() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('table-input').style.display = 'block';
  document.getElementById('tableNumber').value = '';
  currentTable = null;
}

function newOrder() {
  document.getElementById('order-summary').style.display = 'none';
  document.getElementById('table-input').style.display = 'block';
  document.getElementById('tableNumber').value = '';
  currentTable = null;
}
