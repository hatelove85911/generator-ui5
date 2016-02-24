/* global sap, jQuery */
sap.ui.define([
  'sap/ui/core/UIComponent',
  'sap/m/routing/Router',
  'sap/ui/core/util/MockServer',
  'sap/ui/model/odata/ODataModel',
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/resource/ResourceModel'
], function (UIComponent, Router, MockServer, ODataModel, JSONModel, ResourceModel) {
  'use strict'
  return UIComponent.extend('<%= namespace %>.Component', {
    metadata: {
      name: '<%= namespace %>',
      version: '1.0',
      includes: [],
      dependencies: {
        libs: ['sap.m'],
        components: []
      },
      rootView: '<%= namespace %>.view.App',
      config: {
        resourceBundle: 'i18n/i18n.properties',
        serviceConfig: {
          name: '<%= namespace %>',
          serviceUrl: '/sap/opu/odata/path/to/srv/' // last slash important, must be there
        },
        appConfig: {
          rootPath: '/sap/bc/ui5_ui5/sap/path/to/app' // don't need last slash, because this root path is used to compose a more complete path.
        }
      },
      routing: {
        config: {
          routerClass: Router,
          viewType: 'XML',
          viewPath: '<%= namespace %>.view',
          controlId: 'idAppControl',
          controlAggregation: "<%= applicationType === 'fs' ? 'pages' : 'detailPages' %>",
          trainsition: 'slide'
        },
        <% if (applicationType === 'fs') { %>
        routes: [{
          pattern: '',
          name: 'home',
          target: 'home'
        }],
        targets: {
          home: {
            viewName: 'Main',
            viewLevel: 1
          }
        }
        <% } else { %>
        <% } %>
      }
    },
    init: function () {
      UIComponent.prototype.init.apply(this, arguments)

      var mConfig = this.getMetadata().getConfig()

      // always use absolute paths relative to our own component
      // (relative paths will fail if running in the Fiori Launchpad)
      // check for BSP environment and set reuse library path
      var rootPath
      ;(function () {
        var iIndex = window.location.pathname.indexOf('/ui5_ui5/')
        rootPath = iIndex !== -1 ? mConfig.appConfig.rootPath : jQuery.sap.getModulePath('<%= namespace %>')
      }())

      // set i18n model
      var i18nModel = new ResourceModel({
        bundleUrl: [rootPath, mConfig.resourceBundle].join('/')
      })
      this.setModel(i18nModel, 'i18n')

      // Create and set domain model to the component
      var sServiceUrl = mConfig.serviceConfig.serviceUrl

      // Mock Server
      if (jQuery.sap.getUriParameters().get('responderOn') === 'true') {
        var oMockServer = new MockServer({
          rootUri: sServiceUrl
        })
        var sMetadataUrl = rootPath + '/model/metadata.xml'
        var sMockdataBaseUrl = rootPath + '/model/'
        oMockServer.simulate(sMetadataUrl, sMockdataBaseUrl)
        oMockServer.start()
      }

      var oModel = new ODataModel(sServiceUrl, true)
      this.setModel(oModel)

      // set device model
      var deviceModel = new JSONModel({
        isTouch: sap.ui.Device.support.touch,
        isNoTouch: !sap.ui.Device.support.touch,
        isPhone: sap.ui.Device.system.phone,
        isNoPhone: !sap.ui.Device.system.phone,
        listMode: sap.ui.Device.system.phone ? 'None' : 'SingleSelectMaster',
        listItemType: sap.ui.Device.system.phone ? 'Active' : 'Inactive'
      })
      deviceModel.setDefaultBindingMode('OneWay')
      this.setModel(deviceModel, 'device')

      this.getRouter().initialize()
    }
  })
})
