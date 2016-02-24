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
var git = require('simple-git')
var childProcess = require('child_process')

// global variabls
var isGitInstalled = false
var githubUsername = ''
var isGitRemoteSet = false
var potencialAppname = ''
var setting = {}
var bestPractice = ''

module.exports = yeoman.generators.Base.extend({
  constructor: function () {
    yeoman.generators.Base.apply(this, arguments)

    this.argument('projectName', {type: String, required: false})
  },
  initializing: {
    initBestPractice: function () {
      this.bps = [['1.28.0', '1.30.0', 'bp_1.28'],
        ['1.30.0', '99.99.99', 'bp_1.28']]
    },
    mkPrjDir: function () {
      if (this.projectName) {
        mkdirp.sync(this.destinationPath(this.projectName))
        this.destinationRoot(this.destinationPath(this.projectName))
      }
    },
    checkGitInstalled: function () {
      isGitInstalled = Boolean(childProcess.execSync('git --version', {
        encoding: 'utf8'
      }))

      if (isGitInstalled) {
        this.initializing._getGithubUser.call(this)
        this.initializing._initGitRepo.call(this)
        this.initializing._checkGitRemoteSet.call(this)
      }
    },
    _getGithubUser: function () {
      var done = this.async()
      this.user.github.username(function (err, username) {
        if (err) {
          this.log(err)
        } else {
          githubUsername = username
        }
        done()
      }.bind(this))
    },
    _initGitRepo: function () {
      git = git(this.destinationPath())
      try {
        fs.accessSync(this.destinationPath('.git'), fs.F_OK)
      } catch (e) {
        git.init(false)
      }
    },
    _checkGitRemoteSet: function () {
      git.getRemotes(true, function (err, remotes) {
        if (err) {
          this.log(err)
        } else {
          isGitRemoteSet = Boolean(remotes.length > 0 && remotes[0].name)
          if (remotes[0] && remotes[0].refs && remotes[0].refs.fetch) {
            var repoNameRegex = /([^/]*)\.git$/
            var match = remotes[0].refs.fetch.match(repoNameRegex)
            potencialAppname = match && match[1]
          }
        }
      }.bind(this))
    }
  },
  prompting: {
    greet: function () {
      this.log(yosay(
        'Welcome to the hunky-dory ' + chalk.red('ui5') + ' generator!'
      ))
    },
    askAppname: function () {
      var done = this.async()
      this.prompt({
        name: 'applicationName',
        message: "What's your application name",
        default: potencialAppname || this.determineAppname()
      }, function (answers) {
        setting.applicationName = answers.applicationName
        done()
      })
    },
    askAppDesc: function () {
      var done = this.async()
      this.prompt({
        name: 'applicationDesc',
        message: 'Describe your application briefly'
      }, function (answers) {
        setting.applicationDesc = answers.applicationDesc
        done()
      })
    },
    askAppType: function () {
      var done = this.async()
      this.prompt({
        name: 'applicationType',
        message: "what's your application type",
        type: 'list',
        default: 'fs',
        choices: [{
          name: 'Full Screen',
          value: 'fs'
        }, {
          name: 'Master Detail',
          value: 'md'
        }]
      }, function (answers) {
        setting.applicationType = answers.applicationType
        done()
      })
    },
    askNamespace: function () {
      var done = this.async()
      this.prompt({
        name: 'namespace',
        message: "what's the namespace ?",
        validate: function () {
          return true
        }
      }, function (answers) {
        setting.namespace = answers.namespace
        done()
      })
    },
    askGitRepoUrl: function () {
      if (isGitInstalled && !isGitRemoteSet) {
        var that = this
        var done = this.async()
        this.prompt({
          name: 'gitRepoUrl',
          message: "what's your git repository ?",
          default: function () {
            return ['git@github.com:', githubUsername || that.user.git.name(), '/', setting.applicationName, '.git'].join('')
          }
        }, function (answers) {
          setting.gitRepoUrl = answers.gitRepoUrl
          done()
        })
      }
    },
    askUI5Type: function () {
      var done = this.async()
      this.prompt({
        name: 'ui5type',
        message: 'openui5 or sapui5 ?',
        type: 'list',
        default: 'sapui5',
        choices: ['sapui5', 'openui5']
      }, function (answers) {
        setting.ui5type = answers.ui5type
        done()
      })
    },
    askUI5Version: function () {
      var done = this.async()
      this.prompt({
        name: 'ui5version',
        message: 'which version of UI5 ?',
        validate: function (response) {
          return Boolean(semver.valid(response))
        }
      }, function (answers) {
        setting.ui5version = answers.ui5version
        done()
      })
    },
    askLocalUI5Resource: function () {
      var done = this.async()

      this.prompt({
        name: 'localui5src',
        message: "what's the path to the local UI5 core ?",
        default: '/libs/' + setting.ui5type + '/' + setting.ui5version + '/runtime/resources/sap-ui-core.js'
      }, function (answers) {
        setting.localui5src = answers.localui5src
        done()
      })
    }
  },
  configuring: {
    saveSetting: function () {
      this.config.set(setting)
    },
    addGitRemote: function () {
      if (isGitInstalled && !isGitRemoteSet && setting.gitRepoUrl) {
        git.addRemote('origin', setting.gitRepoUrl)
      }
    }
  },
  determineBestPractice: function () {
    var selectedBp = this.bps.find(function (bp) {
      return semver.gte(setting.ui5version, bp[0]) && semver.lt(setting.ui5version, bp[1])
    })
    if (selectedBp) {
      bestPractice = selectedBp[2]
    }
  },

  writing: function () {
    var done = this.async()
    var bpPath = this.templatePath(bestPractice)
    var destinationPath = this.destinationPath()

    // start walking through every file and directory in the best practice directory
    var walker = walk.walk(bpPath)
    walker.on('directory', function (root, stat, next) {
      var relativeDirPath = path.relative(bpPath, path.resolve(root, stat.name))
      var destdir = path.resolve(destinationPath, relativeDirPath)

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
    var appTypeExcludeRegex = setting.applicationType === 'fs' ? /(Master|Detail).(view|controller).(xml|js)/ : /Main.(view|controller).(xml|js)/
    walker.on('file', function (root, stat, next) {
      if (appTypeExcludeRegex.test(stat.name)) {
        next()
        return
      }
      var file = path.resolve(root, stat.name)
      var relativeFilePath = path.relative(bpPath, file)
      var destFile = path.resolve(destinationPath, relativeFilePath)

      var content = fs.readFileSync(file, 'utf8')
      var renderedContent = ejs.render(content, setting)
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
