// @ts-nocheck
sap.ui.define([
    "sap/ui/core/UIComponent",
    "logaligroup/SAPUI5/model/Models",
    "sap/ui/model/resource/ResourceModel",
    "./controller/HelloDialog"
],/**
 @param {typeof sap.ui.core.UIComponent} UIComponent 

*/

    function (UIComponent, Models, ResourceModel, HelloDialog) {
        return UIComponent.extend("logaligroup.SAPUI5.Component", {

            metadata: {
                manifest: "json"
            },

            init: function () {
                UIComponent.prototype.init.apply(this, arguments);
                //seteamos el datamodel en la vista
                this.setModel(Models.createRecipient());

               /*  var i18nModel = new ResourceModel({ bundleName: "logaligroup.SAPUI5.i18n.i18n" });
                this.setModel(i18nModel, "i18n"); */

                this._helloDialog = new HelloDialog(this.getRootControl());
                    //create views based on the url / hash o pattern.
                this.getRouter().initialize();

            },
            exit: function () {
                this._helloDialog.destroy();
                delete this._helloDialog;
            },
            openHelloDialog : function(){
             this._helloDialog.open();   
            }
        });
    });