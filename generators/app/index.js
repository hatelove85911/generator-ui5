'use strict'
var yeoman = require('yeoman-generator')
var chalk = require('chalk')
var yosay = require('yosay')
var walk = require('walk')
var fs = require('fs')
var path = require('path')
var mkdirp = require('mkdirp')
var semver = require('semver')
var touch = require('touch')
var ejs = require('ejs')

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments)
  },
  initializing: function () {
    this.bps = [['1.28.0', '1.30.0', 'bp_1.28'],
      ['1.30.0', '99.99.99', 'bp_1.30']]
  },

  prompting: function () {
    var done = this.async()

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the hunky-dory ' + chalk.red('generator-ui5') + ' generator!'
    ))

    // first prompts
    var askForAppName = {
      name: 'applicationName',
      message: "what's the application name ?"
    }
    var askForAppDesc = {
      name: 'applicationDesc',
      message: 'Describe your application briefly'
    }
    var askForGitRepoUrl = {
      name: 'gitRepoUrl',
      message: "what's your git repository?"
    }
    var askForSapOrOpenUI5 = {
      name: 'ui5type',
      message: "what's the UI5 library type ?",
      type: 'list',
      default: 'sapui5',
      choices: ['sapui5', 'openui5']
    }
    var askForUI5Version = {
      name: 'ui5version',
      message: 'which version of UI5 ?'
    }
    var askForNamespace = {
      name: 'namespace',
      message: "what's the namespace ?"
    }
    var prompts = [askForAppName, askForAppDesc, askForGitRepoUrl, askForSapOrOpenUI5, askForUI5Version, askForNamespace]

    this.prompt(prompts, function (props) {
      this.props = props

      // second prompts based on
      var askForLocalUI5Resource = {
        name: 'localui5src',
        message: "what's the path to the local UI5 core ?",
        default: '/libs/' + props.ui5type + '/' + props.ui5version + '/runtime/resources/sap-ui-core.js'
      }
      var prompts2 = [askForLocalUI5Resource]
      this.prompt(prompts2, function (props) {
        this.props.localui5src = props.localui5src

        done()
      }.bind(this))
    }.bind(this))
  },

  configuring: function () {
    this.config.set(this.props)
  },

  pickBestPractice: function () {
    var ui5version = this.props.ui5version
    var selectedBp = this.bps.find(function (bp) {
      return semver.gte(ui5version, bp[0]) && semver.lt(ui5version, bp[1])
    })
    if (selectedBp) {
      this.bpPath = selectedBp[2]
    }
  },

  writing: function () {
    var done = this.async()
    var bpPath = this.templatePath(this.bpPath)
    var destinationPath = this.destinationPath()

    // start walking through every file and directory in the best practice directory
    var walker = walk.walk(bpPath)
    walker.on('directory', function (root, stat, next) {
      var relative_dirpath = path.relative(bpPath, path.resolve(root, stat.name))
      var destdir = path.resolve(destinationPath, relative_dirpath)

      mkdirp(destdir, function (err) {
        if (err) {
          console.error(err)
        } else {
          touch.sync(path.resolve(destdir, '.gitkeep'))
        }
        next()
      })
    })

    // start walking through file, read every file render them using ejs and output
    var props = this.props
    walker.on('file', function (root, stat, next) {
      var file = path.resolve(root, stat.name)
      var relative_filepath = path.relative(bpPath, file)
      var destFile = path.resolve(destinationPath, relative_filepath)

      var content = fs.readFileSync(file, 'utf8')
      var renderedContent = ejs.render(content, props)
      fs.writeFileSync(destFile, renderedContent)

      next()
    })

    // end the async
    walker.on('end', function () {
      done()
    })
  },

  install: function () {
    this.installDependencies()
  }
})
