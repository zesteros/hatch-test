const express = require("express");
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

const brands = [
    "Chevrolet", "Dodge", "Ford", "GMC", "Honda"
];

var quotes = JSON.parse(fs.readFileSync('quotes.json', 'utf8'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/bestOptionsPerYear', function (req, res) {
    var year = req.body.year;
    
    if(!year || year == undefined){
        var response = {
            "status": 500,
            "message": "Field year is missing"
        };
        res.send(response);
    } else {
        findBestOptionPerYear(res, req.body.year);
    }
});

/**
 * find best insurance carrier by year
 * @param {response} res 
 * @param {int} year 
 */
function findBestOptionPerYear(res, year){}

app.post('/quoteCar', function (req, res) {
  res.send("hello from quoteCar")
});

app.listen(8091, () => {
 console.log("El servidor está inicializado en el puerto 8091");
});
