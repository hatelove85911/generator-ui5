/* global sap */
sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/core/routing/History'
], function (Controller, History) {
  Controller.extend('<%= namespace %>.view.BaseController', {
    getEventBus: function () {
      var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView())
      return sap.ui.component(sComponentId).getEventBus()
    },
    getRouter: function () {
      return sap.ui.core.UIComponent.getRouterFor(this)
    },
    getComponent: function () {
      return this.getOwnerComponent()
    },
    getApp: function () {
      return this.getComponent().__App__
    },
    onNavBack: function (oEvent) {
      var oHistory, sPreviousHash

      oHistory = History.getInstance()
      sPreviousHash = oHistory.getPreviousHash()

      if (sPreviousHash !== undefined) {
        window.history.go(-1)
      } else {
        this.getRouter().navTo('invitations', {}, true /* no history*/) // Home
      }
    },
    onNavButtonPressed: function () {
      this.getRouter().backWithoutHash(this.getView())
    }
  })
})
