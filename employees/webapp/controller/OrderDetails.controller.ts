import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route";
import Signature from "../control/Signature";
import MessageBox from "sap/m/MessageBox";
import Context from "sap/ui/model/odata/v2/Context";
import Utils from "../utils/Utils";
import ODataListBinding from "sap/ui/model/odata/v2/ODataListBinding";
import Filter from "sap/ui/model/Filter";
import UploadSet, { UploadSet$AfterItemRemovedEvent, UploadSet$BeforeUploadStartsEvent, UploadSet$UploadCompletedEvent } from "sap/m/upload/UploadSet";
import UploadSetItem, { UploadSetItem$OpenPressedEvent } from "sap/m/upload/UploadSetItem";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";
import Item from "sap/ui/core/Item";

/**
 * @namespace com.logaligroup.employees.controller
 */

export default class OrderDetails extends BaseController {

    public onInit () : void {
        const router = this.getRouter();
            router.getRoute("RouteOrderDetails")?.attachPatternMatched(this.onObjectMatched.bind(this));
    }

    private onObjectMatched( event: Route$PatternMatchedEvent) : void {
        const viewModel = this.getModel("view") as JSONModel;
            viewModel.setProperty("/layout","EndColumnFullScreen");
        
        const args = event.getParameter("arguments") as any;
        const orderId = args.OrderId;
        const view = this.getView();
        const $this = this;

        view?.bindElement({
            path: "/Orders("+orderId+")",
            model: 'northwind',
            events: {
                change: function () {
                    $this.onClearPress();
                    $this.onRefreshPress();
                    $this.searchFiles();
                }
            }
        });
    }

    public onClearPress () : void {
        const oSignaturePad = this.byId("signature") as Signature;
        oSignaturePad.clear();
    }

    public async onSavePress () : Promise<void> {
        const oSignaturePad = this.byId("signature") as Signature;
        const resourceBundle = this.getResourceBundle();
        const bindingContext = this.getView()?.getBindingContext("northwind") as Context;
        const utils = new Utils(this);
        
        if (!oSignaturePad.isFill()) {
            MessageBox.error(resourceBundle.getText("fillSignature") || 'no text defined');
        } else {
            const oSignature = this.byId("signature") as Signature;
            const sMediaContent = oSignature.getSignature().replace("data:image/png;base64,","");
            const body = {
                url: "/SignatureSet",
                data: {
                    OrderId: bindingContext.getProperty("OrderID").toString(),
                    SapId: utils.getEmail(),
                    EmployeeId: bindingContext.getProperty("EmployeeID").toString(),
                    MimeType: 'image/png',
                    MediaContent: sMediaContent
                }

            };

            await utils.crud('create', new JSONModel(body));
        }
    }

    public async read () : Promise<void | ODataListBinding> {
        const bindingContext = this.getView()?.getBindingContext("northwind") as Context;
        const utils = new Utils(this);
        const sOrderId = bindingContext.getProperty("OrderID").toString();
        const sSapId = utils.getEmail();
        const sEmployeeId = bindingContext.getProperty("EmployeeID").toString();

        const body = {
            url : `/SignatureSet`,
            filters: [
                new Filter("OrderId", "EQ", sOrderId),
                new Filter("SapId","EQ",sSapId),
                new Filter("EmployeeId","EQ", sEmployeeId)
            ]
        };

        return await utils.read(new JSONModel(body));
    }

    private showSignature (data: void | ODataListBinding) : void {
        let object = data as any;
        let sMediaContent = object.results[0].MediaContent;
        const oSignature = this.byId("signature") as Signature;
        oSignature.setSignature("data:image/png;base64,"+sMediaContent);
    }

    public async onRefreshPress () : Promise<void> {
        const results = await this.read();
        this.showSignature(results);
    }

    public onBeforeUpload (event : UploadSet$BeforeUploadStartsEvent) : void {
        const item = event.getParameter("item") as UploadSetItem;
        const utils = new Utils(this);
        const bindingContext = this.getView()?.getBindingContext("northwind") as Context;
        const OrderId = bindingContext.getProperty("OrderID").toString();
        const SapId = utils.getEmail();
        const EmployeeId = bindingContext.getProperty("EmployeeID").toString();
        const FileName = item.getFileName();
        const MediaType = item.getMediaType();
        const slug = `${OrderId};${SapId};${EmployeeId};${FileName}`;
        const model = this.getModel("zincidence") as ODataModel;
        const token = model.getSecurityToken();

        const addHeaderSlug= new Item({
            key: 'slug',
            text: slug 
        });

        const addHeaderToken = new Item({
            key: 'X-Csrf-Token',
            text: token
        });

        item.addHeaderField(addHeaderSlug);
        item.addHeaderField(addHeaderToken);
    }

    public onUploadCompleted (event: UploadSet$UploadCompletedEvent) : void {
        const uploadSet = event.getSource(); //this.byId("uploadS");
        uploadSet.getBinding("items")?.refresh();
    }

    public searchFiles () : void {
        const utils = new Utils(this);
        const bindingContext = this.getView()?.getBindingContext("northwind") as Context;
        const OrderId = bindingContext.getProperty("OrderID").toString();
        const SapId = utils.getEmail();
        const EmployeeId = bindingContext.getProperty("EmployeeID").toString();
        const oUploadSet = this.byId("upload") as UploadSet;

        oUploadSet.bindAggregation("items",{
            path: 'zincidence>/FilesSet',
            filters: [
                new Filter("OrderId","EQ", OrderId),
                new Filter("SapId", "EQ" ,SapId),
                new Filter("EmployeeId", "EQ" , EmployeeId)
            ],
            template: new UploadSetItem({
                fileName: "{zincidence>FileName}",
                mediaType: '{zincidence>MimeType}',
                visibleEdit: false,
                url: "/sap/opu/odata/sap/YSAPUI5_SRV_01/FilesSet",
                openPressed: this.onOpenPressed.bind(this)
            })
        });
    }

    public async onAfterItemDelete (event : UploadSet$AfterItemRemovedEvent) : Promise<void>  {
        const item = event.getParameter("item") as UploadSetItem,
            bindingContext = item.getBindingContext("zincidence") as Context,
            sPath = bindingContext.getPath() as string,
            body = {
                url: sPath
            };
        const utils = new Utils(this);
        await utils.crud('delete', new JSONModel(body));
        item.getBinding("items")?.refresh();
    }

    public  onOpenPressed (event : UploadSetItem$OpenPressedEvent) : void {
        const item = event.getParameter("item") as UploadSetItem,
            bindingContext = item.getBindingContext("zincidence") as Context,
            sPath = bindingContext.getPath();
        let url = "/sap/opu/odata/sap/YSAPUI5_SRV_01"+sPath+"/$value";
            item.setUrl(url);    
    }

}