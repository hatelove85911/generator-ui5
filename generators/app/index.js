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
// var git = require('nodegit')
var git = require('simple-git')
var Q = require('q')

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments)

    this.argument('projectName', {type: String, required: false})
  },
  initializing: function () {
    var that = this
    var done = this.async()

    // best pratice range and the corresponding template folder
    this.bps = [['1.28.0', '1.30.0', 'bp_1.28'],
      ['1.30.0', '99.99.99', 'bp_1.30']]

    // if project name argument is provided, then mkdir the project dir and change
    // destination root to the project dir
    if (this.projectName) {
      mkdirp.sync(this.destinationPath(this.projectName))
      this.destinationRoot(this.destinationPath(this.projectName))
    }

    // get github username
    var getGithubUsername = Q.nbind(this.user.github.username, this.user.github)()
    getGithubUsername.then(function (username) {
      that.github_username = username
    })

    // check whether git repository is already initialized at the destination path
    git = git(this.destinationPath())
    var gitInitProm = 'done'
    try {
      fs.accessSync(this.destinationPath('.git'), fs.F_OK)
    } catch (e) {
      gitInitProm = Q.nbind(git.init, git)(false)
    }

    var getRemoteProm = Q.nbind(git.getRemotes, git)()
    getRemoteProm.then(function (remotes) {
      that.isGitRemoteSet = !!(remotes.length > 0 && remotes[0].name)
    })

    Q.all([ gitInitProm, getGithubUsername, getRemoteProm ]).finally(function () {
      done()
    })
  },
  prompting: function () {
    var that = this
    var applicationName = this.determineAppname()
    var done = this.async()

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the hunky-dory ' + chalk.red('ui5') + ' generator!'
    ))

    // first prompts
    var askForGitRepoUrl = {
      name: 'gitRepoUrl',
      message: "what's your git repository ?",
      default: function () {
        var urlArray = ['git@github.com:', that.github_username || that.user.git.name(), '/', applicationName, '.git']
        return urlArray.join('')
      },
      when: function () {
        return !that.isGitRemoteSet
      }
    }
    var askForAppDesc = {
      name: 'applicationDesc',
      message: 'Describe your application briefly'
    }
    var askForUI5Type = {
      name: 'ui5type',
      message: 'openui5 or sapui5 ?',
      type: 'list',
      default: 'sapui5',
      choices: ['sapui5', 'openui5']
    }
    var askForUI5Version = {
      name: 'ui5version',
      message: 'which version of UI5 ?',
      validate: function (response) {
        return !!semver.valid(response)
      }
    }
    var askForNamespace = {
      name: 'namespace',
      message: "what's the namespace ?",
      validate: function () {
        return true
      }
    }
    var prompts = [askForGitRepoUrl, askForAppDesc, askForUI5Type, askForUI5Version, askForNamespace]

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
        this.props.applicationName = (this.props.gitRepoUrl && this.props.gitRepoUrl.match(/\/(.*)\.git/)[1]) || applicationName
        done()
      }.bind(this))
    }.bind(this))
  },

  configuring: function () {
    var done = this.async()
    this.config.set(this.props)
    // git config
    if (this.props.gitRepoUrl) {
      git.addRemote('origin', this.props.gitRepoUrl, function () {
        done()
      })
    }
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
