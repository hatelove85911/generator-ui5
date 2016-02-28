'use strict'
var yeoman = require('yeoman-generator')
var fs = require('fs')
var path = require('path')

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments)

    this.argument('fragmentname', {type: String, required: true})
  },
  writing: function () {
    try {
      fs.accessSync(this.destinationPath('fragment'), fs.F_OK)
      var destinationPath = this.destinationPath('fragment')
    } catch (e) {
      destinationPath = this.destinationPath()
    }

    this.copy(this.templatePath('template.fragment.xml'), path.resolve(destinationPath, this.fragmentname + '.fragment.xml'))
  }
})
