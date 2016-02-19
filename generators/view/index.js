'use strict'
var yeoman = require('yeoman-generator')
var walk = require('walk')
var fs = require('fs')
var path = require('path')
var ejs = require('ejs')

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

    var walker = walk.walk(this.templatePath())
    // start walking through file, read every file render them using ejs and output
    walker.on('file', function (root, stat, next) {
      var viewFileName = stat.name.replace(/template/, props.viewname)
      var destFile = path.resolve(destinationPath, viewFileName)

      var content = fs.readFileSync(path.resolve(root, stat.name), 'utf8')
      var renderedContent = ejs.render(content, props)
      fs.writeFileSync(destFile, renderedContent)
      next()
    })
  }
})
