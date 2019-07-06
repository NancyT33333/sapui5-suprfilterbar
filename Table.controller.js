sap.ui.define([
	'./Formatter',
	'sap/m/MessageBox',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/json/JSONModel',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"

], function (Formatter, MessageBox, Controller, JSONModel, Filter, FilterOperator) {
	"use strict";

	var TableController = Controller.extend("sap.m.sample.Table.Table", {
		formatter: Formatter,
		onInit: function () {
			// set explored app's demo model on this sample
			var oModel = new JSONModel(sap.ui.require.toUrl("sap/ui/demo/mock") + "/products.json");

			this.getView().setModel(oModel);

			this._aTableSearchState = [];
			var that = this;
			oModel.dataLoaded().then(function (data) {
				var oTable = that.getView().byId("idProductsTable");
				var aTableItems = oTable.getItems();
				that._fnAggregate(aTableItems);

			});
		},

		/**
		 * Refreshes UI state of all filters
		 * @public
		 */

		filtersRefresh: function () {
			var oView = this.getView();
			var oProductSF = oView.byId("productSearchField"),
				oSupplierSF = oView.byId("supplierSearchField"),
				oWeightSlider = oView.byId("weightSlider"),
				oPriceSelect = oView.byId("priceSelect");

			oProductSF.setValue("");
			oSupplierSF.setValue("");
			oWeightSlider.setValue(oWeightSlider.getMax());
			oPriceSelect.setSelectedKey("");

		},

		filterWeight: function (oEvent) {
			this.filtersRefresh();
			var nMaxWeight = oEvent.getParameters().value;
			//as it was refreshed, we have to set value again
			var oWeightSlider = this.getView().byId("weightSlider");
			oWeightSlider.setValue(nMaxWeight);
			this._aTableSearchState = [];

			this._aTableSearchState.push(new Filter("WeightMeasure", FilterOperator.LT, nMaxWeight));
			this._applySearch(this._aTableSearchState);
			var oTable = this.getView().byId("idProductsTable"),
				aTableItems = oTable.getItems();
			this._fnAggregate(aTableItems);

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

		onPriceSelect: function (oEvent) {
			this.filtersRefresh();
			var sKey = oEvent.getParameters().selectedItem.getKey();
			//as it was refreshed, we have to set value again
			this.getView().byId("priceSelect").setSelectedKey(sKey);
			this._aTableSearchState = [];

			var oFilter = new Filter("Price");
			oFilter.fnTest = function (value) {
				switch (sKey) {
				case "Cheap":
					return value < 50;
				case "Medium":
					return value >= 50 && value <= 100;
				case "Expensive":
					return value > 100;
				}
			};

			this._aTableSearchState.push(oFilter);
			this._applySearch(this._aTableSearchState);
			var oTable = this.getView().byId("idProductsTable"),
				aTableItems = oTable.getItems();
			this._fnAggregate(aTableItems);

		},

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

		onSearch: function (oEvent) {
			var sSFID = oEvent.getSource().getId(); //sSFID - search field ID

			this._aTableSearchState = [];
			var sQuery = oEvent.getParameter("query");

			if (sQuery && sQuery.length > 0) {
				if (sSFID.includes("supplierSearchField")) {
					this._aTableSearchState = [new Filter("SupplierName", FilterOperator.StartsWith, sQuery)];
					this.getView().byId("productSearchField").setValue("");

				} else if (sSFID.includes("productSearchField")) {
					this._aTableSearchState = [new Filter("Name", FilterOperator.StartsWith, sQuery)];
					this.getView().byId("supplierSearchField").setValue("");
				}
			}
			this._applySearch(this._aTableSearchState);

			var oTable = this.getView().byId("idProductsTable"),
				aTableItems = oTable.getItems();
			this._fnAggregate(aTableItems);
			this.filtersRefresh();
		},

		onSelectionFinish: function (oEvent) {
			var aSelectedItems = oEvent.getParameter("selectedItems");
			var oTable = this.byId("idProductsTable");
			var aSticky = aSelectedItems.map(function (oItem) {
				return oItem.getKey();
			});

			oTable.setSticky(aSticky);
		},

		onToggleInfoToolbar: function (oEvent) {
			var oTable = this.byId("idProductsTable");
			oTable.getInfoToolbar().setVisible(!oEvent.getParameter("pressed"));
		},
		onSuggest: function (event) {

			var value = event.getParameter("suggestValue"),
				oSF = this.getView().byId("productSearchField");

			var filters = [];
			if (value) {
				filters = [
					new sap.ui.model.Filter("Name", FilterOperator.StartsWith, value)
				];
			}

			oSF.getBinding("suggestionItems").filter(filters);
			oSF.suggest();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_fnAggregate: function (aItems) {

			var nTotalWeight = 0,
				nTotalPrice = 0,
				formatter = this.formatter;

			aItems.forEach(function (item) {
				var aCells = item.getCells(),
					sWeightUnit = aCells[3].getUnit(),
					nWeightMeasure = Number(aCells[3].getNumber()),
					nPrice = aCells[4].getNumber();
				nPrice = formatter.priceParse(nPrice)[0];

				if (sWeightUnit === "G") {
					nWeightMeasure = nWeightMeasure / 1000;
				}
				nTotalWeight += nWeightMeasure;
				nTotalPrice += nPrice;
			});

			nTotalPrice = this.formatter.price(nTotalPrice);
			nTotalWeight = this.formatter.weight(nTotalWeight);
			var oWeightTotal = this.byId("weightTotal"),
				oPriceTotal = this.byId("priceTotal");
			oWeightTotal.setNumber(nTotalWeight);
			oPriceTotal.setNumber(nTotalPrice);
			oWeightTotal.setUnit("KG");

		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function (aTableSearchState) {
			var oTable = this.byId("idProductsTable");

			oTable.getBinding("items").filter(aTableSearchState);
			// changes the noDataText of the list in case there are no filter results

		}

	});

	return TableController;

});