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
            getCoverageTypeCheaper(coverage, quote);
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

/**
 * endpoint for quote car
 */
app.post('/quoteCar', function (req, res) {
    /**
     * start the response with status 200, we need to be optimist
     */
    var response = {
        "status": 200,
        "message": "OK",
        "data": []
    };
    /**
     * first of all validate all fields
     */
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
 
        /**
         * get again coverage types
         */
        var coverages = getCoverageTypes();

        /**+
         * if we have AC sum extra coverage price for all quotes
         */
        if(req.body.hasAC){
            sumExtraCoveragePrice();
        }


        /**
         * sort quotes by lowest price
         */
        sortQuotes();

        /**
         * is almost the same logic as quotes by year but here we need the new price (if apply)
         */
        quotes.forEach(quote => {
            if(quote.brand === req.body.brand && isInYearRange(req.body.year, quote.yearRange)){
                getCoverageTypeCheaper(coverages, quote);
            }
        });

        /**
         * create clean array for bussiness rule purposes
         */

        var quotesResult = [];

        /**
         * if we have best option push to new array
         */
        coverages.forEach(coverageElement => {
            if(coverageElement.bestOption != null)
                quotesResult.push(coverageElement.bestOption);
        });

        response.data = quotesResult;

        /**
         * if we doesn't have any quote send 204 no content status.
         */
        if(response.data.length == 0){
            response.status = 204;
            response.message = "We couldn't find quotes with the parameteres given";
        }

        res.status(response.status).send(response);

        /**
         * we need new quotes because we are going to edit the price (if necessary)
         */
        quotes = req.body.hasAC ? JSON.parse(fs.readFileSync('quotes.json', 'utf8')) : quotes;
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

/**
 * sort quotes by price
 */
function sortQuotes(){
     /**
     * sort all the prices from cheaper to expensive
     */
    quotes.sort(function(a, b) {
        return unformatNumber(a.price) - unformatNumber(b.price);
    });
}

/**
 * get coverage types
 */
function getCoverageTypes(){
    return [
        {"coverageType": "RC", "obtained": false, "bestOption": null}, 
        {"coverageType": "Low", "obtained": false, "bestOption": null}, 
        {"coverageType": "Mid", "obtained": false, "bestOption": null}, 
        {"coverageType": "High", "obtained": false, "bestOption": null}
    ];
}

/**
 * 
 * @param {number} amount 
 * @param {text} decimalCount 
 * @param {text} decimal 
 * @param {text} thousands 
 */
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

/**
* sum the extra coverage price (if applies)
*/
function sumExtraCoveragePrice(){
    quotes.forEach(quote => {
        var newPrice = unformatNumber(quote.price) + 
        unformatNumber(quote.extraCoveragePrice);
        quote.price = formatMoney(newPrice);
    });
}

/**
 * 
 * @param {coverages array} coverages 
 * @param {quote} quote 
 */
function getCoverageTypeCheaper(coverages, quote){
    coverages.forEach(coverageElement => {
        if(quote.coverageType === coverageElement.coverageType && !coverageElement.obtained){
            coverageElement.bestOption = quote;
            /**
             * mark the cheaper budget as obtained
             */
            coverageElement.obtained = true;
        }
    });
}

app.listen(8091, () => {
 console.log("El servidor está inicializado en el puerto 8091");
});
