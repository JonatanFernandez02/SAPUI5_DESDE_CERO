//@ts-nocheck
sap.ui.define([
    "sap/ui/core/util/MockServer",
    "sap/ui/model/json/JSONModel",
    "sap/base/util/UriParameters",
    "sap/base/Log"

],
    /**
     * @param {typeof sap.ui.core.util.MockServer}MockServer
     * @param {typeof sap.ui.model.json.JSONModel}JSONModel
     * @param {typeof sap.base.util.UriParameters}UriParameters
     * @param {typeof sap.base.Log}Log
     */

    function (MockServer, JSONModel, UriParameters, Log) {
        "use strict";

        var oMockServer,
            _sAppPath = "logaligroup/SAPUI5/",
            _sJsonFilesPath = _sAppPath + "localService/mockdata";

        var oMockServerInterface = {
            /* los parametros que se pasan en la llamada que se realiza  cuando inicializamos el servidor*/
            /**
             * Inicializamos el mockserver asincrono.
             * @protected
             * @param {object} oOptionsParameter 
             * @returns {Promise} una promesa q se resuelve, en mockserver.js , cuando el mockserver inicia.
             */
            init: function (oOptionsParameter) {

                var oOptions = oOptionsParameter || {};

                return new Promise(function (fnResolve, fnReject) {
                    var sManifestUrl = sap.ui.require.toUrl(_sAppPath + "manifest.json"),
                        oManifestModel = new JSONModel(sManifestUrl);

                    oManifestModel.attachRequestCompleted(function () {
                        var oUriParameters = new UriParameters(window.location.href);

                        //parse manifest for local metadata URI 
                        var sJsonFilesUrl = sap.ui.require.toUrl(_sJsonFilesPath);
                        var oMainDataSource = oManifestModel.getProperty("/sap.app/dataSources/mainService");
                        var sMetadataUrl = sap.ui.require.toUrl(_sAppPath + oMainDataSource.settings.localUri);

                        //ensure there is trailing slash 
                        var sMockServerUrl = oMainDataSource.uri && new URI(oMainDataSource.uri).absoluteTo(sap.ui.require.toUrl(_sAppPath)).toString();

                        // creacion de instancia de mock server, o stop la existente para reinicializar.

                        if (!oMockServer) {

                            oMockServer = new MockServer({
                                rootUri: sMockServerUrl
                            });
                        } else {
                            oMockServer.stop();
                        }
                        // configurar mock server con opciones o default con delay de 0.5 seg

                        MockServer.config({
                            autoRespond: true,
                            autoRespondAfter: (oOptions.delay || oUriParameters.get("serverDelay") || 500)
                        });
                        // simular los request usando el mock data.  
                        oMockServer.simulate(sMetadataUrl, {
                            sMockdataBaseUrl : sJsonFilesUrl,
                            bGenerateMissingMockData : true
                        });

                        var aRequests = oMockServer.getRequests();

                        // compose an Error response for each request.
                        var fnResponse = function (iErrorCode, sMessage, aRequest){
                            
                            aRequest.response = function(oXhr){
                                oXhr.respond(iErrorCode,{"Content-Type": "text/plain;charset=utf-8"},sMessage);
                            };
                        };
                        // simular errores de metadatos
                        if(oOptions.metadataError || oUriParameters.get("metadataError")){
                             aRequests.forEach(function (aEntry) {
                                 if(aEntry.path.toString().indexof("$metadata") > -1) { 
                                     fnResponse(500, "metadata Error", aEntry);
                                 }
                             });
                        };

                        // simular errores de request 
                        var sErrorParam = oOptions.errorType || oUriParameters.get("errorType");
                        var iErrorCode = sErrorParam === "badRequest" ? 400 : 500;

                        if (sErrorParam){
                            aRequests.forEach(function (aEntry) {
                                fnResponse(iErrorCode, sErrorParam, aEntry);
                            });
                        };

                        // set request and start server!!!

                        oMockServer.setRequests(aRequests);
                        oMockServer.start();

                        Log.info("Running the app with mock data");
                        fnResolve();
                    }); 
                    oManifestModel.attachRequestFailed(function(){
                        var sError = "Failed to load the application manifest";
                        Log.error(sError);
                        fnReject(new Error(sError));
                    });
                });
            }

        };
        //devolvemos la interfaz del mockserver con lo que necesitamos
        return oMockServerInterface;

    });