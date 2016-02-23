/* global sap */
sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/ui/core/Component',
  'sap/ui/core/UIComponent',
  'sap/m/App'
], function (Controller, Component, UIComponent, App) {
  return Controller.extend('<%= namespace %>.view.BaseController', {
    getEventBus: function () {
      return this.getComponent().getEventBus()
    },
    getRouter: function () {
      return this.getComponent().getRouter()
    },
    getComponent: function () {
      return this.getOwnerComponent()
    }
  })
})
