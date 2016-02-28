'use strict'
var yeoman = require('yeoman-generator')
var fs = require('fs')
var path = require('path')

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments)

    this.argument('viewname', {type: String, required: true})
  },
  writing: function () {
    var props = this.config.getAll()
    props.viewname = this.viewname

    try {
      fs.accessSync(this.destinationPath('view'), fs.F_OK)
      var destinationPath = this.destinationPath('view')
    } catch (e) {
      destinationPath = this.destinationPath()
    }

    this.fs.copyTpl(this.templatePath('template.view.xml'), path.resolve(destinationPath, this.viewname + '.view.xml'), props)
    this.fs.copyTpl(this.templatePath('template.controller.js'), path.resolve(destinationPath, this.viewname + '.controller.js'), props)
  }
})
