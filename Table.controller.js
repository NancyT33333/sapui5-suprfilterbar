sap.ui.define([
	'./Formatter',
	'sap/m/MessageBox',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/m/Dialog',
	'sap/m/Image',
	'sap/m/Button',
	'sap/ui/model/FilterType'

], function (Formatter, MessageBox, Controller, JSONModel, Filter, FilterOperator, Dialog, Image, Button, FilterType) {
	"use strict";

	var TableController = Controller.extend("sap.m.sample.Table.Table", {
		formatter: Formatter,
		onInit: function () {
			// set explored app's demo model on this sample
			var oModel = new JSONModel(sap.ui.require.toUrl("sap/ui/demo/mock") + "/products.json");

			this.getView().setModel(oModel);

			this._aTableSearchState = [];
			
			this.oFilterBar = this.getView().byId("filterBar");
		
			this._aTableSldState = [];
			this._aTableCmbState = [];
			this._aTableSFProduct = [];    
			this._aTableSFSupplier = [];    
		
			
			var that = this;
			oModel.dataLoaded().then(function (data) {
				that._fnAggregate();
			});
		},
	

		/**
		 * Event handler when slider gets changed 
		 * @public
		 * @param {sap.ui.base.Event} oEvent the slider change event
		 */

		onChangeSldWeight: function (oEvent) {
		
			this._aTableSldState = [];
			var nMaxWeight = oEvent.getParameters().value;
		
			var oFilterG = new Filter([new Filter("WeightMeasure", FilterOperator.LT, nMaxWeight * 1000), new Filter("WeightUnit",
				FilterOperator.EQ, "G")], true);
			var oFilterKG = new Filter([new Filter("WeightMeasure", FilterOperator.LT, nMaxWeight), new Filter("WeightUnit", FilterOperator.EQ,
				"KG")], true);
		
			this._aTableSldState.push(new Filter([oFilterG, oFilterKG], false));
			this._applySearch();
		
			this._fnAggregate();

		},
		/**
		 * Event handler when an image gets pressed
		 * @param {sap.ui.base.Event} oEvent the image's press event
		 * @public
		 */
		
		onImageMessagePress: function (oEvent) {
			//sPath = oEvent.getElementBinding get path + "ProductPicUrl"
		//	sPath = this.getView().byId(oEvent.getParameter("id"));
		var oBundle = this.getView().getModel("i18n").getResourceBundle();
		var sTitle = oBundle.getText("imageMessageTitle");
		var sImageUrl = oEvent.getSource().getBindingContext().getProperty("ProductPicUrl");
	
			var dialog = new Dialog({
				title: sTitle,
				type: 'Message',
				state: 'Information',
				content: new Image({
					src: sImageUrl
				}),
				beginButton: new Button({
					text: 'OK',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress: function (oEvent) {
			// The source is the list item that got pressed
			var oItem = oEvent.getSource();
			var sDetails = oItem.getBindingContext().getProperty("Description");
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sTitle = oBundle.getText("messageBoxTitle");
			MessageBox.information(
				sDetails, {
					title: sTitle,

					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		},

		/**
		 * Event handler when a  priceSelect ListItem gets pressed
		 * @param {sap.ui.base.Event} oEvent the select change event
		 * @public
		 */
		onChangeSltPrice : function (oEvent) {
	
			this._aTableCmbState = [];
			var sKey = oEvent.getParameters().selectedItem.getKey();
		
			function fnTest(value) {
				switch (sKey) {
				case "All":
					return true;
				case "Cheap":
					return value < 50;
				case "Medium":
					return (value >= 50 && value <= 100);
				case "Expensive":
					return value > 100;
				}
			}
			var oFilter = new Filter("Price", fnTest);

			this._aTableCmbState.push(oFilter);
			this._applySearch();
		
			this._fnAggregate();

		},

		/* sap.m.Table control's sample method*/
		onPopinLayoutChanged: function () {
			var oTable = this.byId("idProductsTable");
			var oComboBox = this.byId("idPopinLayout");
			var sPopinLayout = oComboBox.getSelectedKey();
			switch (sPopinLayout) {
			case "Block":
				oTable.setPopinLayout(sap.m.PopinLayout.Block);
				break;
			case "GridLarge":
				oTable.setPopinLayout(sap.m.PopinLayout.GridLarge);
				break;
			case "GridSmall":
				oTable.setPopinLayout(sap.m.PopinLayout.GridSmall);
				break;
			default:
				oTable.setPopinLayout(sap.m.PopinLayout.Block);
				break;
			}
		},

		
		/** 
		 * Event handler when SearchField "sfSupplier"'s event search gets fired 
		 * @param {sap.ui.base.Event} oEvent the SearchField search event
		 * @public
		 */
		onSfSupplierSearch: function (oEvent) {
			var oSource = oEvent.getSource();
			var sQuery = oSource.getValue();
			this._aTableSFSupplier =[];
			if (sQuery && sQuery.length !== 0) {
				this._aTableSFSupplier = [new Filter("SupplierName", FilterOperator.StartsWith, sQuery)];
			}
			this._applySearch();
			this._fnAggregate();
		},
		
		/** 
		 * Event handler when SearchField "sfProduct"'s event search gets fired 
		 * @param {sap.ui.base.Event} oEvent the SearchField search event
		 * @public
		 */
		onSfProductSearch: function (oEvent) {
			var oSource = oEvent.getSource();
			var sQuery = oSource.getValue();	
			this._aTableSFProduct = [];
			
			if (sQuery && sQuery.length !== 0) {
				this._aTableSFProduct = [new Filter("Name", FilterOperator.StartsWith, sQuery)];
					
			}
			this._applySearch();
			this._fnAggregate();
		},
		/* sap.m.Table control's sample method*/
		onSelectionFinish: function (oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems");
			var oTable = this.byId("idProductsTable");
			var aSticky = aSelectedItems.map(function (oItem) {
				return oItem.getKey();
			});

			oTable.setSticky(aSticky);
		},

		/* sap.m.Table control's sample method*/
		onToggleInfoToolbar: function (oEvent) {
			var oTable = this.byId("idProductsTable");
			oTable.getInfoToolbar().setVisible(!oEvent.getParameter("pressed"));
		},

		/**
		 * Event handler when a SearchField state gets changed 
		 * @param {sap.ui.base.Event} event - the SearchField suggest event
		 * @public
		 */
		onSuggest: function (event) {

			var value = event.getParameter("suggestValue"),
				oSF = this.getView().byId("sfProduct");

			var filters = [];
			if (value) {
				filters = [
					new Filter("Name", FilterOperator.StartsWith, value)
				];
			}

			oSF.getBinding("suggestionItems").filter(filters);
			oSF.suggest();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Aggregates all the tables's items 
		 * @private
		 */
		_fnAggregate: function () {
			var oTable = this.getView().byId("idProductsTable"),
				aItems = oTable.getItems();
			var fTotalWeight = 0,
				fTotalPrice = 0;

			aItems.forEach(function (item) {
				var fWeightMeasure = item.getBindingContext().getProperty("WeightMeasure"),
					sWeightUnit = item.getBindingContext().getProperty("WeightUnit"),
					fPrice = item.getBindingContext().getProperty("Price");

				if (sWeightUnit === "G") {
					fWeightMeasure = fWeightMeasure / 1000;
				}
				fTotalWeight += fWeightMeasure;
				fTotalPrice += fPrice;
			});

			fTotalPrice = this.formatter.price(fTotalPrice);
			fTotalWeight = this.formatter.weight(fTotalWeight);
			var oWeightTotal = this.byId("weightTotal"),
				oPriceTotal = this.byId("priceTotal");
			oWeightTotal.setNumber(fTotalWeight);
			oPriceTotal.setNumber(fTotalPrice);
			oWeightTotal.setUnit("KG");

		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applySearch: function () {
			var oTable = this.byId("idProductsTable");
			this._aTableSearchState = this._aTableSFSupplier.concat(this._aTableSFProduct, this._aTableCmbState, this._aTableSldState);
			oTable.getBinding("items").filter(this._aTableSearchState, FilterType.Application);
			
			this._aTableSearchState = [];
		}

	});

	return TableController;

});