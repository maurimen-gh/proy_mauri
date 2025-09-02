import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import Panel from "sap/m/Panel";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/vk/View";
import Button, { Button$PressEvent } from "sap/m/Button";
import Toolbar from "sap/m/Toolbar";
import Context from "sap/ui/model/odata/v2/Context";
import Utils from "../utils/Utils";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import ODataListBinding from "sap/ui/model/odata/v2/ODataListBinding";
import { DatePicker$ChangeEvent } from "sap/m/DatePicker";
import { Input$LiveChangeEvent } from "sap/m/Input";
import { Select$ChangeEvent } from "sap/m/Select";
import Event from "sap/ui/base/Event";
import ObjectListItem from "sap/m/ObjectListItem";

/**
 * @namespace com.logaligroup.employees.controller
 */

export default class Details extends BaseController {

    panel : Panel

    public onInit () : void {
        const router = this.getRouter();
        router.getRoute("RouteDetails")?.attachPatternMatched(this.onObjectMatched.bind(this));
    }

    private formModel () : void {
        const model = new JSONModel([]);
        this.setModel(model, "form");
    }

    private onObjectMatched (event : Route$PatternMatchedEvent) : void {
        
        //reset
        this.removeAllContent();
        this.formModel();

        const modelView = this.getModel("view") as JSONModel;
        modelView.setProperty("/layout","TwoColumnsMidExpanded");

        const args = event.getParameter("arguments") as any;
        const index = args.index;
        const view = this.getView();
        const reference = this;

        view?.bindElement({
            path: "/Employees("+index+")",
            model: 'northwind',
            events: {
                change: function () {
                    reference.read();
                },
                dataRequest: function () {
                    console.log("Estoy a punto de iniciar el enlace");
                },
                dataReceived: function () {
                    console.log("Ya termine de enlazar los datos");
                }
            }
        });

    }

    public onClosePress () : void {
        const router = this.getRouter();
        const viewModel = this.getModel("view") as JSONModel;
        viewModel.setProperty("/layout", "OneColumn");
        router.navTo("RouteMaster");
    }

    private removeAllContent () : void {
        const panel = this.byId("tableIncidence") as Panel;
        panel.removeAllContent();
    }

    public async onCreatePress () : Promise<void> {
        const panel = this.byId("tableIncidence") as Panel;
        // const view = this.getView() as View;

        // Fragment.load({
        //     id: view.getId(),
        //     name: "com.logaligroup.employees.fragment.NewIncidence",
        //     controller: this
        // });

        const formModel = this.getModel("form") as JSONModel;
        const data = formModel.getData();
        const index = data.length;
        data.push({Index: index + 1});
        formModel.refresh();

        this.panel = await <Promise<Panel>> this.loadFragment({
            name: "com.logaligroup.employees.fragment.NewIncidence"
        });

        this.panel.bindElement({
            path: 'form>/'+index,
            model: 'form'
        });

        panel.addContent(this.panel);
        
    }

    public async onSave (event : Button$PressEvent) : Promise<void> {

        const button = event.getSource() as Button;
        const toolbar = button.getParent() as Toolbar;
        const panel = toolbar.getParent() as Panel;
        const form = panel.getBindingContext("form");
        const northwind = this.getView()?.getBindingContext("northwind") as Context;
        const utils = new Utils(this);

        if (typeof form?.getProperty("IncidenceId") === 'undefined') {
            console.log("Estoy a crear un nuevo registro");
            const object = {
                url: "/IncidentsSet",
                data: {
                    SapId: utils.getEmail(),
                    EmployeeId: (northwind.getProperty("EmployeeID") as number).toString(),
                    CreationDate: form?.getProperty("CreationDate"),
                    Type: form?.getProperty("Type"),
                    Reason: form?.getProperty("Reason")
                },
                filters: [
                    new Filter("SapId", FilterOperator.EQ, utils.getEmail()),
                    new Filter("EmployeeId", FilterOperator.EQ, (northwind.getProperty("EmployeeID") as number).toString() )
                ]
            }
            const results = await utils.crud('create', new JSONModel(object));
            this.showIncidents(results);
        } else {
            console.log("Estoy a punto de hacer una actualización");
            const incidenceId = form.getProperty("IncidenceId");
            const sapId = utils.getEmail();
            const employeeId = (northwind.getProperty("EmployeeID") as number).toString();

            const object = {
                url: "/IncidentsSet(IncidenceId='"+incidenceId+"',SapId='"+sapId+"',EmployeeId='"+employeeId+"')",
                data: {
                    SapId: sapId,
                    EmployeeId: employeeId,
                    CreationDate: form?.getProperty("CreationDate"),
                    CreationDateX: form?.getProperty("CreationDateX"),
                    Type: form?.getProperty("Type"),
                    TypeX: form.getProperty("TypeX"),
                    Reason: form?.getProperty("Reason"),
                    ReasonX: form?.getProperty("ReasonX")
                },
                filters: [
                    new Filter("SapId", FilterOperator.EQ, utils.getEmail()),
                    new Filter("EmployeeId", FilterOperator.EQ, employeeId )
                ]
            }

            const results = await utils.crud('update', new JSONModel(object));
            this.showIncidents(results);
        }
    }

    public async onDelete (event : Button$PressEvent) : Promise<void> {
        const button = event.getSource() as Button;
        const toolbar = button.getParent() as Toolbar;
        const panel = toolbar.getParent() as Panel;
        const form = panel.getBindingContext("form");
        const northwind = this.getView()?.getBindingContext("northwind") as Context;
        const utils = new Utils(this);

        const incidenceId = form?.getProperty("IncidenceId");
        const sapId = utils.getEmail();
        const employeeId = northwind.getProperty("EmployeeID");

        let object = {
            url: "/IncidentsSet(IncidenceId='"+incidenceId+"',SapId='"+sapId+"',EmployeeId='"+employeeId+"')",
            filters: [
                new Filter("SapId", FilterOperator.EQ, utils.getEmail()),
                new Filter("EmployeeId", FilterOperator.EQ, employeeId )
            ]
        };

        const results = await utils.crud('delete', new JSONModel(object));
        this.showIncidents(results);
    }

    private async read () : Promise<void> {
        const utils = new Utils(this);
        const northwind = this.getView()?.getBindingContext("northwind") as Context;
        const employeeId = northwind.getProperty("EmployeeID");

        const object = {
            url: "/IncidentsSet",
            filters: [
                new Filter("SapId", FilterOperator.EQ, utils.getEmail()),
                new Filter("EmployeeId", FilterOperator.EQ, employeeId )
            ]
        }

        const results = await utils.read(new JSONModel(object));
        console.log(results);
        this.showIncidents(results);
    }

    private async showIncidents (results : ODataListBinding | void ) : Promise<void> {

        //Limpiar las incidencias
        const panel = this.byId("tableIncidence") as Panel;
        panel.removeAllContent();

        //Setear el tipo de dato, con el fin de poder acceder al nivel 1 del objeto results
        const array = results as any;

        //Resetear los resultados
        const formModel = this.getModel("form") as JSONModel;
        formModel.setData(array.results);

        //Hacer un mapeo
        array.results.forEach(async (incidence : object, index : number)=>{
            const newIncidence = await <Promise<Panel>> this.loadFragment({name:"com.logaligroup.employees.fragment.NewIncidence"});
            newIncidence.bindElement("form>/"+index);
            panel.addContent(newIncidence);
        }); 

    }

    public updateIncidenceCreationDate (event : DatePicker$ChangeEvent) : void {
        const context = event.getSource().getBindingContext("form") as Context;
        let object = context.getObject() as any;
        object.CreationDateX = true;
    }

    public updateIncidenceReason (event : Input$LiveChangeEvent) : void {
        const context = event.getSource().getBindingContext("form") as Context;
        let object = context.getObject() as any;
        object.ReasonX = true;
    }

    public updateIncidenceType (event : Select$ChangeEvent) : void {
        const context = event.getSource().getBindingContext("form") as Context;
        let object = context.getObject() as any;
        object.TypeX = true;
    }

    public onNavToOrderDetails (event : Event) : void {
        const item = event.getSource() as ObjectListItem;
        const bindingContext = item.getBindingContext("northwind") as Context;
        const orderId = bindingContext.getProperty("OrderID");
        console.log(bindingContext.getPath());
        console.log(bindingContext.getObject());
        
        const router = this.getRouter();
        router.navTo("RouteOrderDetails", {
            OrderId: orderId
        });
    }

}