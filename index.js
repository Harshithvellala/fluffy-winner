const fs = require("fs");
const readline = require("readline");
const express = require("express");
const path = require("path");
const app = express();
const databasePath = "database.json";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

function readDataBase() {
  try {
    const data = fs.readFileSync(databasePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.log("Error in Reading Database.");
  }
}

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/users/allusers", (req, res) => {
  const usersData = readDataBase().users;
  // res.send(usersData);
  res.render('allUsers',{usersData});
});

app.get("/users/:username", (req, res) => {
  const usersData = readDataBase().users;
  const userName = req.params.username;
  const details = usersData[userName];
  // console.log(details);
  if (details) {
    // res.send(details);
    res.render('queryParams',{details: JSON.stringify(details),uName: userName});
  } else {
    res.send(`No data found for username: ${userName}`);
  }
});

app.post("/users/addusr", (req, res) => {
  const dbData = readDataBase();
  const newUserData = req.body;
  const newUsrName = newUserData.uName;
  const newUserDetails = newUserData.details;
  try {
    dbData.users[newUsrName] = newUserDetails;
    fs.writeFileSync(databasePath, JSON.stringify(dbData, null, 2), "utf8");
    res.send(`${newUsrName} added Successfully.`);
  } catch (error) {
    res.send("Error in adding new user");
  }
});

app.get("/prods/allprods", (req, res) => {
  const data = readDataBase();
  const prodData = data.products;
  res.render('allProd',{data : prodData});
  // res.send(prodData);
});

app.get("/prod/:prodid", (req, res) => {
  const data = readDataBase().products;
  const pid = req.params.prodid;
  const productData = data[pid];
  if (productData) {
    res.send(productData);
  } else {
    res.send(`Product data for ${pid} is not found.`);
  }
});

app.post("/prod/newprod", (req, res) => {
  const dbData = readDataBase();
  const newPname = req.body.pName;
  const newPrDetails = req.body.pDetails;
  try {
    dbData.products[newPname] = newPrDetails;
    fs.writeFileSync(databasePath, JSON.stringify(dbData, null, 2), "utf8");
    res.send(`${newPname} is added Successfully`);
  } catch (error) {
    res.send("Error in adding new product");
  }
});

app.get("/orders/allords", (req, res) => {
  const data = readDataBase();
  const orderData = data.orders;
  // res.render('allOrders',{od : orderData});
  res.send(orderData);
});

app.get("/orders/:oid", (req, res) => {
  const data = readDataBase().orders;
  const oid = req.params.oid;
  const oidData = data[oid];
  console.log(oidData);
  if (oidData) {
    res.send(oidData);
  } else {
    res.send(`No Data found for Order Id: ${oid}`);
  }
});

app.post("/orders/placeorder", (req, res) => {
  const dbData = readDataBase();
  const orderId = req.body.oId;
  const customer = req.body.oDetails.uid;
  const orderDetails = req.body.oDetails;
  const orderQuantity = orderDetails.quantity;
  const total = orderQuantity * orderDetails.price;
  const avilQuatntity = availableQuant(orderDetails.pid);
  const pid = getProductById(orderDetails.pid);
  try {
    dbData.orders[orderId] = orderDetails;
    const currentOrders = dbData.users[customer].orders;
    currentOrders.push(orderId);
    dbData.orders[orderId] = orderDetails;
    dbData.users[customer].orders = currentOrders;
    dbData.orders[orderId].total = total; 
    if (avilQuatntity < orderQuantity) {
      res.send("Requesting quantity exceeds available quantity");
    } else {
      dbData.products[pid].quantity = avilQuatntity - orderQuantity;
      // console.log(
      //   (dbData.products[pid].quantity = avilQuatntity - orderQuantity)
      // );
      fs.writeFileSync(databasePath, JSON.stringify(dbData, null, 2), "utf8");
      res.send(`Order with Id: ${orderId} placed Successfully.`);
    }
  } catch (error) {
    res.send("Error in placing order");
  }
});

function getProductById(prodId) {
  const dbData = readDataBase();
  const products = dbData.products;
  let prod_id = "";
  for (prod in products) {
    if (products[prod].pid === prodId) {
      prod_id = prod;
      return prod;
    }
  }
}

function availableQuant(prodId) {
  const dbData = readDataBase();
  const prod_id = getProductById(prodId);
  const aQuant = dbData.products[prod_id].quantity;
  return aQuant;
}