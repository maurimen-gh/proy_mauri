import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FilterBar$SearchEvent, FilterBar$ClearEvent } from "sap/ui/comp/filterbar/FilterBar";
import Control from "sap/ui/core/Control";
import Input from "sap/m/Input";
import ComboBox from "sap/m/ComboBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Table from "sap/m/Table";
import ListBinding from "sap/ui/model/ListBinding";
import Event from "sap/ui/base/Event";
import ObjectListItem from "sap/m/ObjectListItem";
import Context from "sap/ui/model/odata/v2/Context";

/**
 * @namespace com.logaligroup.employees.controller
 */
export default class Master extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.loadCountries();
        this.loadFilter();
    }


    private loadCountries () : void {
        const model = new JSONModel();
        model.loadData("../model/Countries.json");
        this.setModel(model, "countries");
    }

    private loadFilter () : void {
        const data : {
            Employee: string,
            Country: string 
        } = {
            Employee: "",
            Country: ""
        };
        const model = new JSONModel(data);
        this.setModel(model, "filters");
    }

    public onFilterBarSearch (event : FilterBar$SearchEvent) : void {
        const controls = event.getParameter("selectionSet") as Control[];
        const input = controls[0] as Input;
        const comboBox = controls[1] as ComboBox;
        const sEmployee = input.getValue();
        const sCountry = comboBox.getSelectedKey();
        const filters = [];

        if (sEmployee) {
            filters.push(new Filter({
                filters:[
                    new Filter("EmployeeID", FilterOperator.EQ, sEmployee),
                    new Filter({
                        filters:[
                            new Filter("FirstName", FilterOperator.Contains, sEmployee),
                            new Filter("LastName", FilterOperator.Contains, sEmployee)
                        ],
                        and: false
                    })
                ],
                and: false
            }));
        }

        if (sCountry) {
            filters.push(new Filter("Country", FilterOperator.EQ, sCountry))
        }

        const table = this.byId("table") as Table;
        const binding = table.getBinding("items") as ListBinding;
        binding.filter(filters);
    }

    public onFilterBarClear (event : FilterBar$ClearEvent) : void {
        const controls = event.getParameter("selectionSet") as Control[];
        const input = controls[0] as Input;
        const comboBox = controls[1] as ComboBox;
        input.setValue("");
        comboBox.setSelectedKey("");
        this.onFilterBarSearch(event);
    }

    public onFilterGeneric() : void {
        const filterModel = this.getModel("filters") as JSONModel;
        filterModel.attachPropertyChange(function () {
            const sEmployee = filterModel.getProperty("/Employee");
            const sCountry = filterModel.getProperty("/Country");
            console.log(sEmployee);
            console.log(sCountry);
        });
    }

    public onNavToDetails (event: Event) : void {

        const item = event.getSource() as ObjectListItem;
        const bindingContext = item.getBindingContext("northwind") as Context;
        const id = bindingContext.getProperty("EmployeeID");
        const path = bindingContext.getPath();

        const router = this.getRouter();
        router.navTo("RouteDetails",{
            index: id
        });

    }
}