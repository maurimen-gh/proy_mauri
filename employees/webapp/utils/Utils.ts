import ResourceBundle from "sap/base/i18n/ResourceBundle";
import MessageBox from "sap/m/MessageBox";
import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataListBinding from "sap/ui/model/odata/v2/ODataListBinding";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
 * @namespace com.logaligroup.employees.utils
 */


export default class Utils {

    private controller : Controller;

    private model : ODataModel;

    private resouceBundle : ResourceBundle;

    constructor (controller : Controller) {
        this.controller = controller;
        this.model = (this.controller.getOwnerComponent() as UIComponent).getModel("zincidence") as ODataModel;
        this.resouceBundle = ((this.controller.getOwnerComponent() as UIComponent).getModel("i18n") as ResourceModel).getResourceBundle() as ResourceBundle;
    }

    public getEmail() : string {
        return "c24c313@logaligroup.com";
    }

    public async crud (action : string, object : JSONModel) : Promise<void | ODataListBinding> {
        const resouceBundle = this.resouceBundle;
        const reference = this;

        return new Promise((resolve,reject)=>{
            MessageBox.confirm(resouceBundle.getText("question") || 'no text defined', {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: async function (sAction : string) {
                    if (sAction === MessageBox.Action.OK) {
                        switch (action) {
                            case 'create': resolve(await reference.create(object)); break;
                            case 'update': resolve(await reference.update(object)); break;
                            case 'delete': resolve(await reference.delete(object)); break;
                        }
                    }
                }
            })
        });
    } 


    private async create (object : JSONModel) : Promise<void | ODataListBinding> {
        const url = object?.getProperty("/url");
        const data = object?.getProperty("/data");
        const resouceBundle = this.resouceBundle;
        const $this = this;

        return new Promise((resolve,reject)=>{
            this.model.create(url, data, {
                success: async function () {
                    MessageBox.success(resouceBundle.getText("success") || 'no text defined');
                    resolve( await $this.read(object));
                },
                error: function () {
                    MessageBox.error(resouceBundle.getText("error") || 'no text defined');
                    reject();
                }
            });
        });

    }

    private async update (object : JSONModel) : Promise<void | ODataListBinding> {

        const url = object?.getProperty("/url");
        const data = object?.getProperty("/data");
        const resouceBundle = this.resouceBundle;
        const $this = this;

        return new Promise((resolve, reject) => {
            this.model.update(url, data, {
                success: async function () {
                    MessageBox.success(resouceBundle.getText("success") || 'no text defined');
                    resolve(await $this.read(object));
                },
                error: function () {
                    MessageBox.error(resouceBundle.getText("error") || 'no text defined');
                    reject();
                }
            });
        });

    }

    private async delete (object : JSONModel) : Promise<void | ODataListBinding> {

        const url = object?.getProperty("/url");
        const resouceBundle = this.resouceBundle;
        const $this = this;

        return new Promise((resolve,reject)=>{
            this.model.remove(url, {
                success: async function () {
                    MessageBox.success(resouceBundle.getText("success") || 'no text defined');
                    resolve(await $this.read(object));
                },
                error: function () {
                    MessageBox.error(resouceBundle.getText("error") || 'no text defined');
                    reject();
                }
            });
        });

    }

    public async read (object : JSONModel) : Promise<void | ODataListBinding> {
        const model = this.model;
        const url = object?.getProperty("/url");
        const filters = object?.getProperty("/filters");
        const resourceBundle = this.resouceBundle;

        return new Promise((resolve, reject)=> {
            model.read(url, {
                filters: filters,
                success: function (data: ODataListBinding) {
                    resolve(data);
                },
                error: function () {
                    //MessageBox.error(resourceBundle.getText("error") || 'no text defined');
                    reject();
                }
            });
        });

    }

}