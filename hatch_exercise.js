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
        res.status(response.status).send(response);
    } else {
        findBestOptionPerYear(res, req.body.year);
    }
});

/**
 * find best insurance carrier by year
 * @param {response} res 
 * @param {int} year 
 */
function findBestOptionPerYear(res, year){
   
    sortQuotes();

    /**
     * list coverages for group below
     */
    var coverage = getCoverageTypes();

    /**
     * for each budget compare if is the cheaper of each coverage type
     */
    quotes.forEach(quote => {
        if(isInYearRange(year, quote.yearRange) && isAvailableBrand(quote.brand)){
            coverage.forEach(coverageElement => {
                if(quote.coverageType === coverageElement.coverageType && !coverageElement.obtained){
                    coverageElement.bestOption = quote;
                    /**
                     * mark the cheaper budget as obtained
                     */
                    coverageElement.obtained = true;
                }
            });
        }
    });
    /**
     * send result
     */
    var result = {
        "status": 200,
        "message": "Best option obtained.",
        "bestOptions": coverage
    };
    res.send(result);
}

app.post('/quoteCar', function (req, res) {
    var response = {
        "status": 200,
        "message": "OK",
        "data": []
    };
    if(!req.body.brand || req.body.brand == undefined){
      response.status = 500;
      response.message = "Brand is missing";
      res.status(response.status).send(response);
    } else if(!req.body.year || req.body.year == undefined){
        response.status = 500;
        response.message = "Year is missing";
        res.status(response.status).send(response);
    } else if(req.body.hasAC == undefined){
        response.status = 500;
        response.message = "hasAC is missing";
        res.status(response.status).send(response);
    } else {
 
        var coverages = getCoverageTypes();

        sortQuotes();

        quotes.forEach(quote => {
            if(quote.brand === req.body.brand && isInYearRange(req.body.year, quote.yearRange)){
                coverages.forEach(coverageElement => {
                    if(quote.coverageType === coverageElement.coverageType && !coverageElement.obtained){
                        coverageElement.bestOption = quote;
                        if(req.body.hasAC){
                            var newPrice = unformatNumber(coverageElement.bestOption.price) + 
                            unformatNumber(coverageElement.bestOption.extraCoveragePrice);
                            coverageElement.bestOption.price = formatMoney(newPrice);
                        }
                        /**
                         * mark the cheaper budget as obtained
                         */
                        coverageElement.obtained = true;
                    }
                });
            }
        });

        var quotesResult = [];

        coverages.forEach(coverageElement => {
            if(coverageElement.bestOption != null)
                quotesResult.push(coverageElement.bestOption);
        });

        response.data = quotesResult;

        if(response.data.length == 0){
            response.status = 204;
            response.message = "We couldn't find quotes with the parameteres given";
        }

        res.status(response.status).send(response);
    }
});


/**
 * unformat currency number
 * @param {String} number 
 */
function unformatNumber(number){
    return Number(number.replace(/[^0-9.-]+/g,""));
}

/**
 * check if input is between year range
 * @param {int} year 
 * @param {int array} yearRange 
 */
function isInYearRange(year, yearRange){
    return year >= yearRange[0] && year <= yearRange[1];
}

/**
 * Check brand
 * @param {String} brand 
 */
function isAvailableBrand(brand){
    var isValidBrand = false;
    brands.forEach(element => {
        if(brand === element) {
          isValidBrand = true;
        }
    });
    return isValidBrand;
}

function sortQuotes(){
     /**
     * sort all the prices from cheaper to expensive
     */
    quotes.sort(function(a, b) {
        return unformatNumber(a.price) - unformatNumber(b.price);
    });
}

function getCoverageTypes(){
    return [
        {"coverageType": "RC", "obtained": false, "bestOption": null}, 
        {"coverageType": "Low", "obtained": false, "bestOption": null}, 
        {"coverageType": "Mid", "obtained": false, "bestOption": null}, 
        {"coverageType": "High", "obtained": false, "bestOption": null}
    ];
}

function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
  
      const negativeSign = amount < 0 ? "-" : "";
  
      let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
      let j = (i.length > 3) ? i.length % 3 : 0;
  
      return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
      console.log(e)
    }
  };

app.listen(8091, () => {
 console.log("El servidor está inicializado en el puerto 8091");
});
