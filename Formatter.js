sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
	"use strict";

	var Formatter = {

		weightState: function (fMeasure, sUnit) {

			// Boarder values for different status of weight
			var fMaxWeightSuccess = 1;
			var fMaxWeightWarning = 5;
			var fAdjustedMeasure = parseFloat(fMeasure);

			// if the value of fMeasure is not a number, no status will be set
			if (isNaN(fAdjustedMeasure)) {
				return "None";
			} else {

				if (sUnit === "G") {
					fAdjustedMeasure = fMeasure / 1000;
				}

				if (fAdjustedMeasure < 0) {
					return "None";
				} else if (fAdjustedMeasure < fMaxWeightSuccess) {
					return "Success";
				} else if (fAdjustedMeasure < fMaxWeightWarning) {
					return "Warning";
				} else {
					return "Error";
				}
			}
		},
		weight: function (nWeight) {

			return Math.round(nWeight * 100) / 100;

		},
		price: function (nPrice) {
			var	oFormatOptions = {
				showMeasure: true,
				currencyCode: true,
				currencyContext: 'standard'
			};
			var	oCurrencyFormat = NumberFormat.getCurrencyInstance(oFormatOptions);
		
			var nValue = Math.round(nPrice * 100) / 100;

			return oCurrencyFormat.format(nValue, "EUR");
		},
		priceParse: function(sPrice) {
			
			var	oCurrencyFormat = NumberFormat.getCurrencyInstance({"currencyCode": false});
			var nPrice = oCurrencyFormat.parse(sPrice);
			return nPrice;
		}
		
		
	};

	return Formatter;

}, /* bExport= */ true);