
const express = require("express");

const app = express();

app.post('/bestOptionsPerYear', function (req, res) {
   res.send("hello from bestOptionsPerYear");
});

app.post('/quoteCar', function (req, res) {
  res.send("hello from quoteCar")
});

app.listen(8091, () => {
 console.log("El servidor está inicializado en el puerto 8091");
});
