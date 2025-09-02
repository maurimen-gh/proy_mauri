import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";

/**
 * @namespace com.logaligroup.employees.controller
 */

export default class Container extends BaseController {

    public onInit () : void {
        this.loadView();
        this.loadEmployees();
    }

    private loadView () : void {
        const data = {
            layout: "OneColumn"
        }
        const model = new JSONModel(data);
        this.setModel(model, "view");
    }

    private loadEmployees () : void {
        const model = new JSONModel();
        model.loadData("../model/Employees.json");
        this.setModel(model, "employees");
    }
}